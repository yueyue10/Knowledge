public class JsBridge {
    JsInterface jsInterface;

    public JsBridge(JsInterface jsInterface) {
        this.jsInterface = jsInterface;
    }

    public void setData(String data) {
        //2.JsBridge通过接口将数据回调到Activity
        jsInterface.setValue(data);
    }
}
