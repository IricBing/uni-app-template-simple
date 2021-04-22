const { readdirSync, writeFile } = require('fs');
const { join, resolve } = require('path');
const router = require('./index.js');

const builder = (app, baseUrl, children, root) => {
  const routeList = [];
  for (const route of children) {
    if (route.children) routeList.push(...builder(baseUrl + route.path + '/', route.children));
    else {
      const item = {
        path: baseUrl + route.path + '/index',
        name: app + '/' + route.name,
        style: {
          navigationBarTitleText: route.title
        }
      };
      Object.keys(route).forEach(prop => !['path', 'name', 'title'].includes(prop) && (item[prop] = Object.assign(item[prop] || {}, route[prop])));
      routeList.push(item);
    }
  }

  // 如果是递归调用根节点，表示此时的routeList已经是完整的页面列表了，将带有home标志的元素移动到数组最开始。
  if (root) {
    const homePageIndex = routeList.findIndex(route => route.home);
    if (~homePageIndex) {
      const homePage = routeList.find(route => route.home);
      delete homePage.home;
      routeList.splice(homePageIndex, 1);
      routeList.unshift(homePage);
    }
  }

  return routeList;
};

// 将路由模块配置文件转化为 uniapp 配置文件格式
const buildRouter = (app, route) => {
  const { baseUrl, children } = route;

  return builder(app, baseUrl, children, true);
};

// 构建 pages
router.pages = readdirSync(resolve(__dirname, './modules'))
  .map(filename => buildRouter('app', require('./modules/' + filename)))
  .flat();

// 写入 pages.json 文件
writeFile(
  join(__dirname, '..', 'pages.json'),
  // 我这边是用两个空格来缩进 pages.json，如果喜欢制表符，第三个参数更换你为 \t 即可
  JSON.stringify(router, null, '  '),
  /* eslint-disable-next-line */
  e => (e ? console.error(e) : console.log('pages.json 配置文件更新成功'))
);
