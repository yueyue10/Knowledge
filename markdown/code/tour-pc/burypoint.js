import Vue from 'vue'
import moment from './moment/moment';
moment.locale('zh-cn');
import uuid from "../utils/uuid.modified.js"
import { getGoodsDetails,uploadPonits } from "../api/common"
import storage from "../utils/localstorage";

/**
 * 初始化商品详情页的url
 */
const browseGoodUrl = "/goods-details/"

/**
 * 点击事件埋点
 * mjl
 * 2020-12-23
 * params 点击的名称
 * routerpath 当前路径
 */
let buryClickPonit = {
  install(Vue) {
    Vue.prototype.buryClickPonit = function(params){
      //全局 this.$root.context
      let clickData = {  //点击事件的缓存数据缓存数据
        type: 2,
        route: this.$root.context.route.fullPath,
        name: params,
        star: moment().format('YYYY-MM-DD HH:mm:ss'),
      }
      let dataArr = []
      dataArr.push(clickData)
      dataArr = dealPonitsArr(dataArr)
      if(this.$root.context.$aixos) {
        uploadPonits(this.$root.context.$aixos,dataArr)
      }
    }
  }
}
Vue.use(buryClickPonit)

/**
 * 页面浏览时长埋点
 * mjl
 * 2020-12-22
 */
export default ({ app }) => { 
  initDeviceMac()
  initPcInfo()  
  app.router.afterEach((to, from) => {
    let setItem = {
      type: 1,
      route: to.path || null,
      prevPage: from.path || null,
      star: moment().format('YYYY-MM-DD HH:mm:ss'),
      end: null,
    }
    try {      
      if(storage.userInfo.get()){
        setItem.userId = storage.userInfo.get().userId
      }
    } catch (error) {
    }
    let setItemBefore = null
    if(localStorage.getItem("beforePage")){
      //上一页浏览的时长结束进行埋点上传
      setItemBefore = JSON.parse(localStorage.getItem("beforePage"))
      setItemBefore.end = moment().format('YYYY-MM-DD HH:mm:ss')
      
      if(to.path.indexOf(browseGoodUrl) > -1){
        //判断是商品详情页，查询商品的信息
        let goodid = to.path.split(browseGoodUrl)[1]
        getGoodsDetails(app.$axios, goodid).then(res =>{
          setItem.eventParams = {}
          setItem.eventParams.goods_id = res.data.shopGoodsWeb.id
          setItem.eventParams.goods_name = res.data.shopGoodsWeb.title
          localStorage.setItem("beforePage",JSON.stringify(setItem))
        }) 
      }else{ 
        //判断不是商品详情页         
        localStorage.setItem("beforePage",JSON.stringify(setItem))
      }
      let dataArr = []
      dataArr.push(setItemBefore)    
      dataArr = dealPonitsArr(dataArr)
      uploadPonits(app.$axios, dataArr) 
    }else{
      //如果上一页没有买入的情况下，进行埋点
      localStorage.setItem("beforePage",JSON.stringify(setItem))
    }
  })
}


/**
 * 初始化PC端信息
 */
function initPcInfo(){
  if(!localStorage.getItem('browser')){        
    localStorage.setItem('browser', navigator.userAgent)
  }
  if(!localStorage.getItem('equipment')){
    localStorage.setItem('equipment', navigator.userAgent)
  }

}

/**
 * 初始化PC端浏览器设备唯一识别码
 */
function initDeviceMac(){
  if(!localStorage.getItem('deviceMac')){
    let inituuid = uuid.v1()
    localStorage.setItem('deviceMac', inituuid)
  }
  console.log("设备唯一标识:"+localStorage.getItem('deviceMac'))
}

/**
 * 格式化前端传入后台的数据结构
 * @param {*} data 
 */
function dealPonitsArr(data){
  let paramsData = data.reduce((a, c) => {
      a.push({
          type: c.type, //统计类型 1浏览 2点击
          createDate: c.star, //创建时间
          url: c.route, //访问地址 当前页
          startDate: c.star, //浏览开始时间
          endDate: c.end, //浏览结束时间
          sourceUrl: c.prevPage, //来源url 上一页面
          btnName: c.name, //点击名称
          userId: c.userId, //用户ID
          browser: localStorage.getItem('browser') || null, //浏览器类型
          screen: window.screen.width+"*"+window.screen.height, //屏幕
          sourceType: "官网", //网站访问来源
          equipment:  localStorage.getItem('equipment') || null,
          deviceMac: localStorage.getItem('deviceMac'),	//小程序或者M站的设备唯一标识
          eventParams: JSON.stringify(c.eventParams),	//浏览记录下面详情参数
      });
      return a;
  }, [])
  return paramsData
}
