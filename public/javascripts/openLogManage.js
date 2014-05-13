/**
 * Created by chenpeng on 14-5-12.
 */
/**
 * Created by chenpeng on 14-3-20.
 */


var logData = [];

//2-5.返回一页数据
if( !logData.pageIndex)
{
    logData.pageIndex = 1;//页码
}

logData.pageCount = 10;//每页记录条数
logData.pages=0;//总页数

//返回第pageIndex页数据
logData.getPageData = function () {
    var pageData = new Array();//定义数组存储一页数据
    for (var i = (this.pageIndex - 1) * this.pageCount; i < this.pageIndex * this.pageCount; i++) {//获取第pageIndex页数据
        //alert(this[i]);
        if (this[i]) {//判断this[i]是否undefined,过滤掉
            pageData[pageData.length] = this[i];
        };
    }
    return pageData;
};

//4.加载表数据（详细信息）
function loadDetailData() {

    var tbList = getElement("logList");//获得表对象
    for (var i = tbList.rows.length - 1; i >= 0; i--) {//删除表所有行
        tbList.deleteRow(i);
    }
    var arrPage = logData.getPageData();//获得一页数据
    loadDataToTb(arrPage);
};
//4-1.加载表数据,arr数组数据
function loadDataToTb(arr) {
    for (var i = 0; i < arr.length; i++) {
        //console.log(JSON.stringify(arr[i]));
        addTr(arr[i]);
    };
    logData.pages = logData.length % logData.pageCount != 0 ? (logData.length - logData.length % logData.pageCount) / logData.pageCount + 1 : logData.length / logData.pageCount;
    getElement('currentPage').innerHTML = logData.pageIndex;
    getElement('allPage').innerHTML = logData.pages;
    if( !arr || arr.length == 0)
    {
        addTr();
    }
};
//4-1.插入一行,model-数组元素
function addTr(model) {
    var tb = getElement("logList");//获得表对象
    var tr = tb.insertRow(-1);//插入一行
    if( model)
    {
        tr.insertCell(-1).innerHTML = "<a href='findDoctorOrderById" + model.userId + "' >" + model.userId +"</a>"
        tr.insertCell(-1).innerHTML = model.doorId;//插入序号列
        tr.insertCell(-1).innerHTML = model.time;//插入名称列
        tr.insertCell(-1).innerHTML = model.password;//插入名称列
        tr.insertCell(-1).innerHTML = model.desc;//插入名称列
    }
    else
    {
        var td = tr.insertCell(-1);
        td.setAttribute('colspan','6');td.innerHTML = "没有记录！";
    }

};
//5.根据标签id获得标签对象
function getElement(id) {
    return document.getElementById(id);
};

//-------窗口加载完毕触发--------//
window.onload = function () {

    loadDetailData();

    //5.分页（先删除当前界面所有行，再添加）
    getElement("btnFirstPage").onclick = function (){
        if(logData.pageIndex !== 1){
            logData.pageIndex = 1;//页码++,取得下一页
            loadDetailData();
        }

    };
    getElement("btnLastPage").onclick = function (){
        logData.pages = logData.length % logData.pageCount != 0 ? (logData.length - logData.length % logData.pageCount) / logData.pageCount + 1 : logData.length / logData.pageCount;
        if(logData.pages !== logData.pageIndex)
        {
            logData.pageIndex = logData.pages;//页码++,取得下一页
            loadDetailData();
        }

    };
    //5-1.下一页
    getElement("btnNextPage").onclick = function () {
        if (logData.length == 0) {
            alert("没有数据");
        };
        //获取总页数
        logData.pages = logData.length % logData.pageCount != 0 ? (logData.length - logData.length % logData.pageCount) / logData.pageCount + 1 : logData.length / logData.pageCount;
        if (logData.pageIndex == logData.pages) {//判断是否最后一页
            alert("最后一页啦");
            return;//返回
        };

        logData.pageIndex++;//页码++,取得下一页
        loadDetailData();
    };
    //5-2.上一页
    getElement("btnPrevPage").onclick = function () {
        if (logData.length == 0) {
            alert("没有数据");
        };
        //获取总页数
        logData.pages = logData.length % logData.pageCount != 0 ? (logData.length - logData.length % logData.pageCount) / logData.pageCount + 1 : logData.length / logData.pageCount;
        if(logData.pageIndex==1){//判断是否第一页
            alert("这个第一页");
            return;
        };

        logData.pageIndex--;//页码--，取得上一页
        loadDetailData();
    };
};