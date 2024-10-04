
    var chinaMap = echarts.init(document.getElementById("china-map"));
    window.onresize = chinaMap.resize; // 窗口或框架被调整大小时执行chinaMap.resize
    chinaMap.setOption({
    // 进行相关配置
    tooltip: {}, // 鼠标移到图里面的浮动提示框
    dataRange: {
    show: false,
    min: 0,
    max: 1000,
    text: ["High", "Low"],
    realtime: true,
    calculable: true,
    color: ["orangered", "#FF9B52", "#FFD068"],
},
    geo: {
    // 这个是重点配置区
    map: "china", // 表示中国地图
    roam: true,
    label: {
    normal: {
    show: true, // 是否显示对应地名
    textStyle: {
    color: "#fff",
},
},
},
    itemStyle: {
    normal: {
    borderColor: "#293171",
    borderWidth: "2",
    areaColor: "#0A0F33",
},
    emphasis: {
    areaColor: null,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 20,
    borderWidth: 0,
    shadowColor: "rgba(0, 0, 0, 0.5)",
},
},
},
    series: [
{
    type: "scatter",
    coordinateSystem: "geo", // 对应上方配置
},
{
    name: "照片张数", // 浮动框的标题
    type: "map",
    geoIndex: 0,
    data: data
},
    ],
});