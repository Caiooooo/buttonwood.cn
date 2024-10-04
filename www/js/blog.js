// 获取 URL 中的 title 参数
const urlParams = new URLSearchParams(window.location.search);
title = urlParams.get('title');


if (title) {
    document.title = title;
    file_path = '../blog/' + title + '.md';
    // 使用 fetch 获取文件内容
    fetch(file_path)
        .then(response => {
            if (!response.ok) {
                window.location.href = window.location.href.split('?')[0];  // 获取当前网页的URL
                throw new Error('Network response was not ok');
            }

            return response.text();
        })
        .then(data => {
            if (data === null) {
                window.location.href = window.location.href.split('?')[0];
            }
            document.querySelector('.cardList').style.display = "none";
            const textarea = document.getElementById('$t');
            textarea.value = data;
            // 更新 markdown 显示
            document.getElementById('$m').innerHTML = marked.parse(textarea.value);
            hljs.highlightAll();
        })
        .catch(error => console.error('Error fetching the file:', error));
} else {
    fetch('https://buttonwood.cn/api/files')
        .then(response => response.json())
        .then(data => {

            // 获取cardList元素
            let cardList = document.querySelector('.cardList');

            // 遍历json数据
            data.forEach(file => {
                // 创建新的<a>标签
                let aTag = document.createElement('a');
                aTag.href = `https://buttonwood.cn/createIdea.html?title=${file.slice(0, -3)}`;
                // aTag.target = '_blank';
                aTag.classList.add('card-default');

                // 创建card div
                let cardDiv = document.createElement('div');
                cardDiv.classList.add('card');
                let empty = document.createElement('div');

                // 图片
                let blogImgDiv = document.createElement('div');
                blogImgDiv.style.backgroundImage = "url(img/icon/书本.png)";
                blogImgDiv.style.width = "32px";
                blogImgDiv.style.height = "32px";
                blogImgDiv.classList.add('bg-img');
                blogImgDiv.classList.add('round');
                blogImgDiv.classList.add('card-icon');

                // 创建card-main div
                let cardMainDiv = document.createElement('div');
                cardMainDiv.classList.add('card-main');
                cardMainDiv.style.width = "182px";
                cardMainDiv.style.height = "100%";

                let cardNameDiv = document.createElement('div');
                let titleall = file.slice(0, -3);
                if (titleall.length > 15) {
                    cardNameDiv.style.marginTop = "-5px"
                }
                cardNameDiv.textContent = titleall;
                cardNameDiv.style.width = "100%";
                cardNameDiv.style.marginLeft = "2px"
                cardNameDiv.style.textAlign = "left"
                cardNameDiv.style.whiteSpace = "normal";

                cardNameDiv.classList.add('card-name');

                // 将card-name div添加到card-main div
                cardMainDiv.appendChild(cardNameDiv);
                empty.appendChild(blogImgDiv);
                empty.appendChild(cardMainDiv);
                cardDiv.appendChild(empty)
                // 将card-main div添加到card div
                cardDiv.appendChild(cardMainDiv);

                // 将card div添加到<a>标签
                aTag.appendChild(cardDiv);

                // 将<a>标签添加到cardList
                cardList.appendChild(aTag);
            });
        })
        .catch(error => console.error(error));
}
