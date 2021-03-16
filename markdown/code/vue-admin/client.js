import request from '@/utils/request1'
import request2 from '@/utils/request'

//=============================持卡客户模块接口=============================
/**
 * 创建/修改持卡客户类
 */
export class ClientList {
  constructor() {
    this.companyMap = {}
    this.keeperMap = {}//这里将管家【userName-phonenumber】以键值对存起来，因为接口没返回管家的手机号
    this.setCompanyMap()
    this.setKeeperMap()
  }

  //获取持卡客户列表
  getClientList(data) {
    return request.http('post', '/card/list', data, true)
  }

  //获取持卡客户详情
  getClientDetail({cardNo}) {
    return request.http('get', '/card/detail', {cardNo})
  }

  //获取结算公司列表
  getCompanyList() {
    return request.http('post', '/company/list', {pageNum: 1, pageSize: 100}, true)
  }

  setCompanyMap() {
    this.getCompanyList().then(res => {
      if (res.code === 0 && res.data) {
        let companyArr = res.data.records
        //将每一项根据按照【id-name】存入【companyMap】对象
        if (companyArr && companyArr.length > 0) companyArr.forEach(com => {
          this.companyMap[com.id] = com.name
        })
      }
    })
  }

  //获取管家列表接口
  setKeeperMap(data) {
    request2({url: '/system/user/list', method: 'get', params: data}).then(res => {
      if (res.code === 200 && res.rows.length > 0) {
        let keeperArr = res.rows
        //将每一项根据按照【id-name】存入【companyMap】对象
        if (keeperArr && keeperArr.length > 0) keeperArr.forEach(com => {
          this.keeperMap[com.userName] = com.phonenumber
        })
      }
    })
  }
}

/**
 * 创建/修改持卡客户类
 */
export class CreateClient {

  //添加持卡客户
  addClient(data, cardExtendList, rightList) {
    let {name, mobile} = data //将主卡人的数据放到【cardExtendList】里面
    cardExtendList.push({name, mobile, isMasterCard: 1})
    data = this.convertCardObj(data, cardExtendList, rightList) //将界面数据转换成接口参数数据
    return request.http('post', '/card/add', data, true)
  }

  //获取持卡客户详情
  getClientDetail({cardNo}) {
    return request.http('get', '/card/detail', {cardNo})
  }

  //修改持卡客户信息
  modifyClient(data, cardExtendList, rightList) {
    data = this.convertCardObj(data, cardExtendList, rightList)
    return request.http('post', '/card/update', data, true)
  }

  //获取组合权益列表
  composeList(data = {pageNum: 1, pageSize: 1000}) {
    return request.http('post', '/compose/right/list', data, true)
  }

  //获取管家列表接口
  getKeeperList(data) {
    return request2({url: '/system/user/list', method: 'get', params: data})
  }

  /**
   * 将【界面持卡客户对象】转成【接口卡片对象】
   */
  convertCardObj(customer, cardExtendList, rightList) {
    // debugger
    let rightName = rightList.find(power => {
      return power.rightNo === customer.rightNo
    }).name
    let cardObj = {
      card: {//持卡信息
        ...customer,
        rightName
      },
      cardExtendList,
      cardNo: customer.entityCardNo//卡号
    }
    return cardObj
  }
}

/**
 * 持卡客户详情类
 */
export class ClientDetail {
  constructor() {
    this.companyMap = {}
    this.setCompanyMap()
  }

  //获取持卡客户详情
  getClientDetail(data) {
    return request.http('get', '/card/detail', data)
  }

  //添加权益人
  addPowerUser({cardNo, name, mobile}) {
    return request.http('post', '/card/other/add', {cardNo, name, mobile}, true)
  }

  //修改权益人
  updatePowerUser({cardNo, id, name, mobile}) {
    return request.http('post', '/card/other/update', {cardNo, id, name, mobile}, true)
  }

  //删除权益人
  deletePowerUser(id) {
    return request.http('get', '/card/other/delete', {id})
  }

  setCompanyMap() {
    this.getCompanyList().then(res => {
      if (res.code === 0 && res.data) {
        let companyArr = res.data.records
        //将每一项根据按照【id-name】存入【companyMap】对象
        if (companyArr && companyArr.length > 0) companyArr.forEach(com => {
          this.companyMap[com.id] = com.name
        })
      }
    })
  }

  //获取管家手机号
  getKeeperPhone(userId) {
    return request2({url: `/system/user/${userId}`, method: 'get', params: {}})
  }

  //获取结算公司列表
  getCompanyList() {
    return request.http('post', '/company/list', {pageNum: 1, pageSize: 100}, true)
  }

  //兑换权益
  exchangePower(customer, power) {
    let linkman = customer.cardExtendList.find(user => {
      return user.id === power.linkmanId
    }).name //取出联系人的姓名给接口使用
    let {name, entityCardNo, butlerPhone,butlerName} = customer.card
    let {right, amount, linkmanId, remark} = power
    let {rightName, rightNumber, rightType, settleCompany} = right
    let recordBo = {
      cardNo: entityCardNo,
      name,
      amount,
      remark,
      linkman,
      linkmanId,
      butlerName,
      butlerPhone,
      rightName,
      rightNumber,
      rightType,
      settleCompany
    }
    return request.http('post', '/record/add', recordBo, true)
  }

}
