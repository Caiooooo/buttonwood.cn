# \[PC/IOS\][星露谷物语]解决茶苗配方bug问题
## 问题描述
在触发卡洛琳二星剧情后，茶苗配方第二天不送到家的问题。推测可能是拿了小镇钥匙后触发的奇怪的bug。
## 解决办法 
PC 找 %APPDATA%\StardewValley\Saves, IOS找文件下的星露谷的存档文件进行修改。

![](blog/img/536aeb9e1a8d738001ec510a12cae4e.png)

搜索/craftingRecipes
记得加前面的斜杠

然后在它前面添加这串东西
<item><key><string>Tea Sapling</string></key><value><int>0</int></value></item>

替换原来的文件后进入游戏，替换前最好备份一遍。