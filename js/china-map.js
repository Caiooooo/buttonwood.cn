
var chinaMap = echarts.init(document.getElementById("china-map"));
window.onresize = chinaMap.resize; // 窗口或框架被调整大小时执行chinaMap.resize
const leftBox = document.getElementById("left-box") || document.getElementById("neo-sidebar");

// 监听 leftBox 宽度变化
if (leftBox) {
    const resizeObserver = new ResizeObserver(() => {
        chinaMap.resize();
    });
    resizeObserver.observe(leftBox);
}
window.addEventListener("resize", function () {
    chinaMap.resize();
});
chinaMap.setOption({
    // 进行相关配置
    tooltip: {
        formatter: function (params) {
            // 将value转换为数字显示
            let value = params.value.toString();
            if (!isNaN(value)) {
                let year = value.substring(0, 4);
                let month = value.substring(4, 6);
                let day = value.substring(6, 8);
                value = `${year}-${month}-${day}`;
            }
            return params.name + ": " + value;
        }
    },
    dataRange: {
        show: false,
        min: 0,
        max: 9999999999,
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
    name: "点亮日期", // 浮动框的标题
    type: "map",
    geoIndex: 0,
    data: data
},
    ],
});