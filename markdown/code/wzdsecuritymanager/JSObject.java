package com.ennova.wzdsecurity.utils.web;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import com.blankj.utilcode.util.GsonUtils;
import com.ennova.wzdsecurity.data.bean.User;
import com.ennova.wzdsecurity.data.local.SpManager;
import com.ennova.wzdsecurity.module.scan.TestScanActivity;
import com.ennova.wzdsecurity.module.securitymanager.SecurityManagerActivity;
import com.ennova.wzdsecurity.module.video.TxPlayerActivity;
import com.ennova.wzdsecurity.module.video.VideoInfo;

import org.json.JSONArray;
import org.json.JSONException;

/**
 * JS调用android的方法
 *
 * @JavascriptInterface仍然必不可少
 */
public class JSObject {
    private Context context;
    private Handler handler;
    private WebView mWebView;
    private static JSObject jsObject;

    public static JSObject setInstance(Context context, Handler handler, WebView mWebView) {
        jsObject = new JSObject(context, handler, mWebView);
        return jsObject;
    }

    public static JSObject getInstance() {
        return jsObject;
    }

    public JSObject(Context context, Handler handler, WebView mWebView) {
        this.context = context;
        this.handler = handler;
        this.mWebView = mWebView;
    }

    //js调用无参方法
    @JavascriptInterface
    public void callNull() {
        Toast.makeText(context, "JsCallAndroid", Toast.LENGTH_SHORT).show();
    }

    //js调用有参方法
    @JavascriptInterface
    public void callMessage(String data) {
        Toast.makeText(context, data, Toast.LENGTH_SHORT).show();
    }

    //js调用有参方法，参数类型：JSON
    @JavascriptInterface
    public void callJson(String data) throws JSONException {
        JSONArray jsonArray = new JSONArray(data);
        Toast.makeText(context, jsonArray.toString(), Toast.LENGTH_SHORT).show();
    }

    //js调用有参方法，参数类型：JSON，获取电话号码拨打
    @JavascriptInterface
    public void callPhone(String data) {

    }

    //js调用有参方法，参数类型：JSON，关闭当前界面
    @JavascriptInterface
    public void closeActivity(String data) {
        handler.sendEmptyMessage(1000);
    }

    //js调用有参方法，参数类型：JSON，关闭当前界面
    @JavascriptInterface
    public void startToDragRvActivity(String data) {

    }

    //js调用有参方法，参数类型：JSON，关闭当前界面
    @JavascriptInterface
    public void callAndroid() {
        System.out.println("callAndroid-");
        Toast.makeText(context, "callAndroid", Toast.LENGTH_SHORT).show();
    }

    /**
     * 真正使用的方法
     */
    @JavascriptInterface
    public void saveAppData(String data) {
        User userBean = GsonUtils.fromJson(data, User.class);
        saveUserInfo(userBean, data);
    }

    @JavascriptInterface
    public void clearAppData() {
        SpManager.getInstance().clearAllUserData();
    }

    @JavascriptInterface
    public String getAppData() {
        String userUserInfo = SpManager.getInstance().getUserUserInfo();
        return userUserInfo;
    }

    @JavascriptInterface
    public void toAppHome(String data) {
        System.out.println("toAppHome" + data);
        context.startActivity(new Intent(context, SecurityManagerActivity.class));
    }

    @JavascriptInterface
    public void toAppScanActivity() {
        context.startActivity(new Intent(context, TestScanActivity.class));
    }

    @SuppressLint("SetJavaScriptEnabled")
    public void fromAppScanResult(String data) {
//        mWebView.loadUrl(String.format("javascript:fromAppScanResult(%s)", data));
        String scanResult = GsonUtils.toJson(new ScanResult(data));
        Log.i("TestScanActivity", scanResult);
        mWebView.loadUrl("javascript:fromAppScanResult(" + scanResult + ")");
    }

    public class ScanResult {
        private String msg;

        public ScanResult(String msg) {
            this.msg = msg;
        }
    }

    //跳转APP视频播放界面
    @JavascriptInterface
    public void toAppVideoActivity(String data) {
        VideoBean videoBean = GsonUtils.fromJson(data, VideoBean.class);
        VideoInfo videoInfo = new VideoInfo(videoBean.getTitle(), videoBean.getUrl());
        Intent intent = new Intent(context, TxPlayerActivity.class);
        intent.putExtra("videoInfo", videoInfo);
        context.startActivity(intent);
    }

    public class VideoBean {
        private String title;
        private String url;

        public VideoBean(String title, String url) {
            this.title = title;
            this.url = url;
        }

        public String getTitle() {
            return title == null ? "" : title;
        }

        public String getUrl() {
            return url == null ? "" : url;
        }
    }

    private void saveUserInfo(User user, String userInfo) {
        SpManager.getInstance().putUserUserInfo(userInfo);
        SpManager.getInstance().putUserId(user.getId());
        SpManager.getInstance().putUserToken(user.getToken());
        SpManager.getInstance().putUserRoleName(user.getRoleName());
        SpManager.getInstance().putUserName(user.getUserName());
    }
}
