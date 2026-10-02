package com.local.familyarchive;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

public class MainActivity extends Activity {

    private static final String APP_HOST = "app.local";
    private static final String APP_URL = "https://" + APP_HOST + "/index.html";
    private static final int REQ_FILE = 4001;

    private WebView web;
    private int loadStage = 0;
    private ValueCallback<Uri[]> fileCb;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);
        applyBarTheme();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.addJavascriptInterface(new Bridge(), "ArchiveNative");

        web.setWebViewClient(new WebViewClient() {

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri url = req.getUrl();
                if (url == null || !APP_HOST.equals(url.getHost())) return null;
                String path = url.getPath();
                if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
                if (path.startsWith("/")) path = path.substring(1);
                if (path.contains("..") || path.indexOf('\\') >= 0) return notFound();
                byte[] data;
                try {
                    InputStream in = getAssets().open(path);
                    data = readAll(in);
                    in.close();
                } catch (IOException e) {
                    return notFound();
                }
                String mime = mimeOf(path);
                return new WebResourceResponse(mime, charsetOf(mime), 200, "OK", null,
                        new ByteArrayInputStream(data));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                return u == null || !APP_HOST.equals(u.getHost());
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (!req.isForMainFrame()) return;
                if (loadStage == 0) {
                    loadStage = 1;
                    web.loadUrl(APP_URL);
                } else if (loadStage == 1) {
                    loadStage = 2;
                    fallbackInline();
                } else {
                    diag(err != null ? String.valueOf(err.getErrorCode()) : "?",
                            err != null && err.getDescription() != null
                                    ? err.getDescription().toString() : "unknown");
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb,
                                             FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                        "image/*",
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "text/plain"
                });
                try {
                    startActivityForResult(Intent.createChooser(i, "选择附件"), REQ_FILE);
                } catch (android.content.ActivityNotFoundException e) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });

        web.loadUrl(APP_URL);
    }

    /* ---------- 资源映射 ---------- */

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        return bos.toByteArray();
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private static String charsetOf(String mime) {
        if (mime.startsWith("text/")) return "utf-8";
        if (mime.contains("javascript")) return "utf-8";
        if (mime.contains("json")) return "utf-8";
        if (mime.contains("svg")) return "utf-8";
        return null;
    }

    private WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null,
                new ByteArrayInputStream("Not Found".getBytes(StandardCharsets.UTF_8)));
    }

    private void fallbackInline() {
        try {
            InputStream in = getAssets().open("index.html");
            String html = new String(readAll(in), StandardCharsets.UTF_8);
            in.close();
            web.loadDataWithBaseURL(APP_URL, html, "text/html", "utf-8", APP_URL);
        } catch (IOException e) {
            diag("IO", e.getMessage());
        }
    }

    private void diag(String code, String desc) {
        String html = "<html><head><meta charset='utf-8'><meta name='viewport'"
                + " content='width=device-width,initial-scale=1'>"
                + "<style>body{font-family:sans-serif;background:#F7F4EF;color:#2B2622;"
                + "padding:32px;line-height:1.8}h2{color:#A85B2A}</style></head>"
                + "<body><h2>加载失败</h2>"
                + "<p>应用内嵌页面未能加载，请截图以下信息反馈：</p>"
                + "<p>错误码：" + code + "</p>"
                + "<p>描述：" + desc + "</p>"
                + "<button onclick='location.reload()' style='padding:10px 24px;"
                + "background:#A85B2A;color:#fff;border:none;border-radius:12px;'>重试</button>"
                + "</body></html>";
        web.loadDataWithBaseURL(APP_URL, html, "text/html", "utf-8", null);
    }

    /* ---------- 文件选择（附件上传） ---------- */

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE) {
            Uri[] out = null;
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<Uri> list = new ArrayList<Uri>();
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    for (int i = 0; i < n; i++) list.add(data.getClipData().getItemAt(i).getUri());
                } else if (data.getData() != null) {
                    list.add(data.getData());
                }
                if (!list.isEmpty()) out = list.toArray(new Uri[0]);
            }
            if (fileCb != null) {
                fileCb.onReceiveValue(out);
                fileCb = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /* ---------- 返回键：先关浮层，再回退，最后最小化 ---------- */

    @Override
    public void onBackPressed() {
        web.evaluateJavascript(
                "(function(){var o=document.querySelector('.overlay');"
                        + "if(o&&window.__closeOverlay){window.__closeOverlay();return '1';}"
                        + "return '0';})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String v) {
                        if (v != null && v.contains("1")) return;
                        if (web.canGoBack()) web.goBack();
                        else moveTaskToBack(true);
                    }
                });
    }

    /* ---------- 深浅色状态栏 ---------- */

    private void applyBarTheme() {
        boolean night = (getResources().getConfiguration().uiMode
                & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        Window w = getWindow();
        w.setStatusBarColor(night ? 0xFF1B1714 : 0xFFF7F4EF);
        w.setNavigationBarColor(night ? 0xFF1B1714 : 0xFFF7F4EF);
        View d = w.getDecorView();
        int flags = d.getSystemUiVisibility();
        if (night) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        d.setSystemUiVisibility(flags);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyBarTheme();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    /* ---------- JS 桥：备份导出到本机「下载/家庭档案」 ---------- */

    private void toastOnUiThread(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    private boolean writeToDownloads(String name, String mime, byte[] bytes) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                cv.put(MediaStore.Downloads.RELATIVE_PATH, "Download/家庭档案");
                cv.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) return false;
                OutputStream os = getContentResolver().openOutputStream(uri);
                if (os == null) return false;
                os.write(bytes);
                os.close();
                cv.clear();
                cv.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, cv, null, null);
                return true;
            } else {
                File dir = new File(getExternalFilesDir(null), "备份");
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, name);
                FileOutputStream fo = new FileOutputStream(f);
                fo.write(bytes);
                fo.close();
                return true;
            }
        } catch (Exception e) {
            return false;
        }
    }

    private class Bridge {

        @JavascriptInterface
        public boolean saveFile(String name, String mime, String content) {
            try {
                boolean ok = writeToDownloads(name, mime, content.getBytes(StandardCharsets.UTF_8));
                if (ok) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        toastOnUiThread("备份已保存到 下载/家庭档案/" + name);
                    } else {
                        toastOnUiThread("备份已保存到应用数据目录");
                    }
                }
                return ok;
            } catch (Exception e) {
                return false;
            }
        }
    }
}
