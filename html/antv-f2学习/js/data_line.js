const pre_data = [{
	date: '2019/11/10',
	personNum: 400
}, {
	date: '2019/11/11',
	personNum: 500
}, {
	date: '2019/11/12',
	personNum: 400
}, {
	date: '2019/11/13',
	personNum: 300
}, {
	date: '2019/11/14',
	personNum: 400
}, {
	date: '2019/11/15',
	personNum: 300
}, {
	date: '2019/11/16',
	personNum: 500
}, {
	date: '2019/11/17',
	personNum: 700
}, {
	date: '2019/11/18',
	personNum: 800
}, {
	date: '2019/11/19',
	personNum: 600
}]

const real_data = [{
	date: '2019/11/10',
	personNum: 300
}, {
	date: '2019/11/11',
	personNum: 400
}, {
	date: '2019/11/12',
	personNum: 500
}, {
	date: '2019/11/13',
	personNum: 400
}, {
	date: '2019/11/14',
	personNum: 500
}, {
	date: '2019/11/15',
	personNum: 400
}, {
	date: '2019/11/16',
	personNum: 500
}, {
	date: '2019/11/17',
	personNum: 600
}, {
	date: '2019/11/18',
	personNum: 700
}, {
	date: '2019/11/19',
	personNum: 800
}]

function addType(list, type) {
	var mList = list
	for (var i = 0; i < mList.length; i++) {
		mList[i].type = type
	}
	return mList
}
var preList = addType(pre_data, '预测')
var realList = addType(real_data, '实际')
// console.log(preList)

const line_data = preList.concat(realList);
