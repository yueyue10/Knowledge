public class Activity implements JsInterface {
    public String LogText = null;

    public Activity() {
        //1.Activity调用JsBridge里面的方法
        JsBridge jsBridge = new JsBridge(this);
        jsBridge.setData("测试");
    }

    @Override
    public void setValue(String value) {
        LogText = value;
        System.out.println("Activity==========" + value);
    }
}
