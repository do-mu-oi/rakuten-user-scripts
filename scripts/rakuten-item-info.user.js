// ==UserScript==
// @version      0.1.1
// @name         楽天商品ページ情報取得
// @author       do-mu-oi
// @license      MIT
// @namespace    https://github.com/do-mu-oi/rakuten-user-scripts
// @match        https://item.rakuten.co.jp/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
#rakuten-item-info {
    box-sizing: border-box;
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
    background: #fff;
    border: 1px #ddd solid;
    font-size: 13px;
    transition: 0.5s;
}

#rakuten-item-info.hide {
    transform: translate(calc(100% - 120px), calc(100% - 30px));
}

#rakuten-item-info .label {
    width: 120px;
    text-align: center;
    line-height: 30px;
}

#rakuten-item-info table {
    width: 800px;
    font-size: 13px;
    margin: 0 10px 10px;
    border-collapse: collapse;
}

#rakuten-item-info.hide table {
}

#rakuten-item-info th, #rakuten-item-info td {
    padding: 3px;
    border: 1px #ddd solid;
}

#rakuten-item-info th {
    width: 180px;
}

#rakuten-item-info tr.category {
    background: #dff;
}

#rakuten-item-info div.container {
    display: flex;
    align-items: center;
}

#rakuten-item-info td div.value {
    flex-grow: 1;
}

#rakuten-item-info td button {
    width: 80px;
    flex-shrink: 0;
}
`);

const createInput = (value) => {
  const selection = window.getSelection();
  const range = document.createRange();

  const el_div = document.createElement("div");
  const el_input = document.createElement("div");
  const el_button = document.createElement("button");

  el_div.className = "container";
  el_input.className = "value";

  el_div.appendChild(el_input);
  el_div.appendChild(el_button);

  el_input.textContent = value;
  el_button.textContent = "コピー";

  el_button.onclick = (event) => {
    range.selectNodeContents(el_input);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
  };

  return el_div;
};

const getCategories = () => {
  const paths = [];
  const nodes_sdtext = document.querySelectorAll(
    ".sdtext, td.breadcrumbs_list:first-child"
  );
  const nodes_subcategory_list = document.querySelectorAll(
    "td > a.subcategory_list"
  );

  [...nodes_sdtext].forEach((sdtext) => {
    let text = sdtext.innerText;
    text = text.trim();
    text = text.replace(/^カテゴリトップ\s>\s/, "");
    text = text.replace(/\s>\s/g, "\\");

    if (text.length > 0) {
      paths.push(text);

      [...nodes_subcategory_list].forEach((subcategory_list) => {
        let subtext = subcategory_list.innerText;
        subtext = subtext.replace(/（）/, "");
        subtext = subtext.trim();
        paths.push(text + "\\" + subtext);
      });
    }
  });

  return paths;
};

class Table {
  constructor(container) {
    this.el = document.createElement("div");
    this.el_table = document.createElement("table");
    const el_label = document.createElement("div");

    this.el.appendChild(el_label);
    this.el.appendChild(this.el_table);

    el_label.className = "label";
    el_label.textContent = "商品ページ情報";
    this.el.id = "rakuten-item-info";
    this.el.className = "hide";

    this.el.onmouseover = (e) => {
      this.el.className = "";
    };

    this.el.onmouseout = (e) => {
      this.el.className = "hide";
    };

    this.mount(container);
  }

  mount(element) {
    element.appendChild(this.el);
  }

  add(title, element, className) {
    const el_tr = document.createElement("tr");
    const el_th = document.createElement("th");
    const el_td = document.createElement("td");

    if (className) {
      el_tr.className = className;
    }

    el_th.textContent = title;
    el_td.appendChild(element);
    el_tr.appendChild(el_th);
    el_tr.appendChild(el_td);
    this.el_table.appendChild(el_tr);
  }

  addInput(title, value, className) {
    const input = createInput(value);
    this.add(title, input, className);
  }
}

{
  const table = new Table(document.body);

  // カテゴリ
  {
    getCategories().forEach((category) => {
      table.addInput("カテゴリ", category, "category");
    });
  }

  // 商品管理番号
  {
    const el = document.querySelector("link[rel='canonical']");
    if (el) {
      const id = el.href.replace(/.*\/([^/]*)\/$/, "$1");
      table.addInput("商品管理番号（商品URL）", id);
    }
  }

  // 商品番号
  {
    const el = document.querySelector("span.item_number");
    if (el) {
      table.addInput("商品番号", el.textContent);
    }
  }

  // 商品名
  {
    const el = document.querySelector("span.item_name b");
    if (el) {
      table.addInput("商品名", el.innerHTML);
    }
  }

  // 商品説明文
  {
    const el = document.querySelector("span.item_desc");
    if (el) {
      const textarea = document.createElement("textarea");
      textarea.style = "width: 100%; height: 200px;";
      textarea.textContent = el.innerHTML;
      table.add("商品説明文", textarea);
    }
  }
}
