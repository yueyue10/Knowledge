package com.ennova.wzdsecurity.module;

import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.DownloadListener;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import com.ennova.wzdsecurity.Contants;
import com.ennova.wzdsecurity.R;
import com.ennova.wzdsecurity.base.activity.AbstractSimpleActivity;
import com.ennova.wzdsecurity.utils.StatusBarUtil;
import com.ennova.wzdsecurity.utils.web.JSObject;
import com.ennova.wzdsecurity.utils.web.MyWebViewClient;

/**
 * 原始的webView
 */
public class FullscreenActivity extends AbstractSimpleActivity {

    private WebView mWebView;
    ProgressBar myProgressBar;
    private WebSettings webSettings;
    private MyWebViewClient WVClient;
    //封装接收js调用Android的方法类
    private JSObject jsobject;
    private String web_url = Contants.web_url;
    //上传文件
    private ValueCallback<Uri> uploadFile;
    private ValueCallback<Uri[]> uploadFiles;
    //异步请求
    private Handler mHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            switch (msg.what) {
                case 1000:
                    finish();
                    break;
            }
        }
    };

    @Override
    public void initStatusBar() {
        StatusBarUtil.setStatusColor(this.getWindow(), getResources().getColor(R.color.blue_title), 1f);
    }

    @Override
    protected int getLayoutId() {
        return R.layout.activity_fullscreen;
    }

    @Override
    protected void onViewCreated() {
    }

    @Override
    protected void initToolbar() {
    }

    @Override
    protected void initEventAndData() {
        init();
        initView();
    }

    private void init() {
        WVClient = new MyWebViewClient();
        mWebView = findViewById(R.id.web_view);
        myProgressBar = findViewById(R.id.myProgressBar);
        jsobject = JSObject.setInstance(FullscreenActivity.this, mHandler, mWebView);
    }

    private void initView() {
        webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setSavePassword(false);
        //支持多种分辨率，需要js网页支持
        //webSettings.setUserAgentString("mac os");
        //webSettings.setDefaultTextEncodingName("utf-8");
        //zyj新加
        mWebView.clearCache(true);
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webSettings.setDomStorageEnabled(true);  // 开启 DOM storage 功能

        webSettings.setSupportZoom(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setDisplayZoomControls(false);
        //显示本地js网页
        //mWebView.loadUrl("file:///android_asset/test.html");
//        mWebView.loadUrl("https://www.baidu.com");
        mWebView.loadUrl(web_url);
        Log.d("FullscreenActivity", web_url);
        mWebView.setWebViewClient(WVClient);
        mWebView.setWebChromeClient(new WebChromeClient() {// 为webview添加进度条
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress >= 95) {
                    myProgressBar.setVisibility(View.GONE);
                } else {
                    myProgressBar.setProgress(newProgress);
                }
                System.out.println("newProgress" + newProgress);
                super.onProgressChanged(view, newProgress);
            }

            // For Android 3.0+
            public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType) {
                Log.i("test", "openFileChooser 1");
                uploadFile = uploadMsg;
                openFileChooseProcess();
            }

            // For Android < 3.0
            public void openFileChooser(ValueCallback<Uri> uploadMsgs) {
                Log.i("test", "openFileChooser 2");
                uploadFile = uploadMsgs;
                openFileChooseProcess();
            }

            // For Android  > 4.1.1
            public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture) {
                Log.i("test", "openFileChooser 3");
                uploadFile = uploadMsg;
                openFileChooseProcess();
            }

            // For Android  >= 5.0
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             WebChromeClient.FileChooserParams fileChooserParams) {
                Log.i("test", "openFileChooser 4:" + filePathCallback.toString());
                uploadFiles = filePathCallback;
                openFileChooseProcess();
                return true;
            }
        });
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                Log.d("onPageStarted", url);
                myProgressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d("onPageFinished", url);
                myProgressBar.setVisibility(View.GONE);
            }
        });
        mWebView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                downloadBySystem(url, contentDisposition, mimeType);
            }
        });
        //注意第二个参数android，这个是JS网页调用Android方法的一个类似ID的东西
        mWebView.addJavascriptInterface(jsobject, "android");
    }

    private void openFileChooseProcess() {
        Intent i = new Intent(Intent.ACTION_GET_CONTENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        startActivityForResult(Intent.createChooser(i, "上传文件"), 0);
    }

    private void downloadBySystem(String url, String contentDisposition, String mimeType) {
        Uri uri = Uri.parse(url);
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        startActivity(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        mWebView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        mWebView.onPause();
    }

    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_DOWN) {
            if (mWebView.canGoBack()) {
                mWebView.goBack();
            } else {
                WebStorage.getInstance().deleteAllData();
                finish();
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 0) {
            if (resultCode == RESULT_OK) {
                if (null != uploadFile) {
                    Uri result = data == null ? null : data.getData();
                    uploadFile.onReceiveValue(result);
                    uploadFile = null;
                }
                if (null != uploadFiles) {
                    Uri result = data == null ? null : data.getData();
                    uploadFiles.onReceiveValue(new Uri[]{result});
                    uploadFiles = null;
                }
            } else if (resultCode == RESULT_CANCELED) {
                if (null != uploadFile) {
                    uploadFile.onReceiveValue(null);
                    uploadFile = null;
                }
                if (null != uploadFiles) {
                    uploadFiles.onReceiveValue(null);
                    uploadFiles = null;
                }
            }
        }
    }
}
