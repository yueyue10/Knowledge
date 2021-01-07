<template>
  <div class="container" style="padding: 20px">
    <!-- 扫码功能 -->
    <div style="height: 50px;margin-top: 20px">
      <h4 class="model-title">测试扫码功能</h4>
      <button @click="toAppScanActivity">扫码</button>
      <div>{{ scanResult }}</div>
    </div>
    <!-- 文件选择 -->
    <div style="margin-top: 50px">
      <h4 class="model-title">测试选择文件功能</h4>
      <input
        class="filechooser"
        id="file_chooser"
        type="file"
        placeholder="选择文件"
        @onchange="displayPath"
        @oninput="displayPath"
      />
      <br/>
      <p id="filechooser_display"></p>
    </div>
    <!-- 文件下载 -->
    <div style="margin-top: 50px">
      <h4 class="model-title">测试文件下载功能</h4>
      <!--      <button @click="downloadFile">下载文件</button>-->
      <!--      <a href="http://81.68.145.189:3000/download/" download>点击下载文件</a>-->
      <a href="http://47.96.137.54:8080/jusafe-boot/api/common/downLoadFile?fileName=212_1595063903562.doc" download>点击下载文件</a>
    </div>
    <!-- 视频播放 -->
    <div style="margin-top: 50px">
      <h4 class="model-title">测试视频播放功能</h4>
      <button @click="toAppVideoActivity">跳转APP视频播放界面</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'index',
  data() {
    return {
      scanResult: ''
    }
  },
  created() {
    window.fromAppScanResult = this.fromAppScanResult
  },
  methods: {
    //跳转APP扫码界面
    toAppScanActivity() {
      window.android.toAppScanActivity()
    },
    //从APP返回数据
    fromAppScanResult(data) {
      console.log('fromAppScanResult', data)
      alert('fromAppScanResult' + data.msg)
      this.scanResult = data.msg
    },
    // 显示文件路径
    displayPath() {
      let path = document.getElementById('file_chooser').textContent
      document.getElementById('filechooser_display').innerHTML('<b>' + path + '</b>')
    },
    // 下载文件
    downloadFile() {
      let src = 'http://81.68.145.189:3000/download/'
      let iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = 'javascript: \'<script>location.href="' + src + '"<\/script>\''
      document.getElementsByTagName('body')[0].appendChild(iframe)
    },
    downloadFile2() {
      window.location.href =
        'http://47.96.137.54:8080/jusafe-boot/api/common/downLoadFile?fileName=法律法规_1594262463873.xls'
      // let url = window.URL.createObjectURL(new Blob([res]))
      // let link = document.createElement('a')
      // link.style.display = 'none'
      // link.href = url
      // link.setAttribute('download', fileName)// 文件名
      // document.body.appendChild(link)
      // link.click()
      // document.body.removeChild(link) // 下载完成移除元素
      // window.URL.revokeObjectURL(url) // 释放掉blob对象
    },
    //跳转APP视频播放界面
    toAppVideoActivity() {
      let video = { title: '001-港池球机-调', url: 'http://cctvalih5ca.v.myalicdn.com/live/cctv1_2/index.m3u8' }
      window.android.toAppVideoActivity(JSON.stringify(video))
    }
  }
}
</script>

<style scoped>
.model-title {
  border-left: 2px solid #2cbbb3;
  padding-left: 7px;
}
</style>
