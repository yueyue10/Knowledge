import utils from "../utils/utils"

// 参数1上下文
// 参数2注入函数
export default ({ $axios}, inject) => {
  // 将来this.$getCode
  inject("getCode", phone => {
    return $axios.$get("/api/admin/mobile/" + phone + "?fromApp=O");
  });

  // 用户登录
  inject("userLogin", params => {
    return $axios.$post(`/api/auth/mobile/token/sms?${utils.objToUrl(params)}`);
  });

  // 获取用户信息
  inject("getUserInfo", _ => {
    return $axios.$get(`/api/admin/user/info`);
  });
  // 当日展览、演出
  inject("showInDay", dayStart => {
    return $axios.$get(`/api/shop/pc-goods/home/show-in-day?dayStart=${dayStart}`)
  });
  //指定日期期间是否有演出
  inject("hasShow", params => {
    const {
      dayStart,
      dayEnd
    } = params;
    return $axios.$get(`/api/shop/pc-goods/home/check-has-show?dayStart=${dayStart}&dayEnd=${dayEnd}`)
  })

  // 获取用户已购商品数量
  inject("api_getUserBuyCount", params => {
    return $axios.$get(`/api/order/order/getBuyCount?` + utils.objToUrl(params));
  });

  // 创建订单
  inject("api_creatOrder", data => {
    return $axios.$post(`/api/order/order`, data);
  });

  // 微信支付
  inject("api_payByWx", data => {
    return $axios.$post(`/api/order/pay/place-order`, data);
  });

  // 会员卡支付
  inject("api_payByCard", orderNumber => {
    return $axios.$post(`/api/order/pay/pay-balance`, {
      orderNumber
    });
  });

  // 获取订单详情
  inject("api_getOrderDetails", orderNumber => {
    return $axios.$get(`/api/order/order/getByOrderNumber?orderNumber=${orderNumber}`);
  });

  //通过根据成长值查询储值选项
  inject("api_getByGrowUp", growUp => {
    return $axios.$get(`/api/shop/stored/option/getByGrowUp/${growUp}`);
  });

};
