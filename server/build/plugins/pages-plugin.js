import {
  IS_BUNDLED_PAGE,
  MATCH_ROUTE_NAME
} from '../../utils'

export default class PagesPlugin {
  apply (compiler) {
    compiler.plugin('after-compile', (compilation, callback) => {
      const pages = Object
        .keys(compilation.namedChunks)
        .map(key => compilation.namedChunks[key])
        .filter(chunk => IS_BUNDLED_PAGE.test(chunk.name))

      pages.forEach((chunk) => {
        const page = compilation.assets[chunk.name]
        const pageName = MATCH_ROUTE_NAME.exec(chunk.name)[1]
        var routeName = '/' + pageName.replace(/[/\\]?index$/, ''); //===== <AKTXYZ/>

        // We need to convert \ into / when we are in windows
        // to get the proper route name
        // Here we need to do windows check because it's possible
        // to have "\" in the filename in unix.
        // Anyway if someone did that, he'll be having issues here.
        // But that's something we cannot avoid.
        if (/^win/.test(process.platform)) {
          routeName = routeName.replace(/\\/g, '/')
        }

        //===== <AKTXYZ>
        // ignore leading ##_
        // console.log("=====> AKTXYZ/ROUTE1 ", pageName);
        // console.log("=====> AKTXYZ/ROUTE2 ", routeName);
        routeName = routeName.replace(/\/\d\d_/, "/").replace(/\/\d\d/, "/");
        // console.log("=====> AKTXYZ/ROUTE3 ", routeName);
        // console.log("=====> AKTXYZ/ROUTE4 ", chunk.name, page.source().length);
        // console.log("=====> AKTXYZ/ROUTEX ", Object.keys(chunk));
        // console.log("=====> AKTXYZ/ROUTEY ", Object.keys(page));
        if (pageName.match(/^App/ && pageName.match(/\d\d_/))) {
          delete compilation.assets[chunk.name];
          // if (pageName.match(/SigninUserPass/) && pageName.match(/App.User/)) console.log("=====> AKTXYZ/ROUTE6A ", chunk.name);
          chunk.name = chunk.name.replace(/\d\d_/, '');
          // if (pageName.match(/SigninUserPass/) && pageName.match(/App.User/)) console.log("=====> AKTXYZ/ROUTE6B ", chunk.name);
        }
        //===== </AKTXYZ>

        // If there's file named pageDir/index.js
        // We are going to rewrite it as pageDir.js
        // With this, we can statically decide the filepath of the page
        // based on the page name.
        const rule = /^bundles[/\\]pages[/\\].*[/\\]index\.js$/
        if (rule.test(chunk.name)) {
          delete compilation.assets[chunk.name]
          chunk.name = chunk.name.replace(/[/\\]index\.js$/, `.js`)
        }

        //===== <AKTXYZ>
        // skip if already generated (content contains "nextRegisterPageDone")
        var content = page.source();
        var newContent = content;
        if (!content.match(/nextRegisterPageDone/)) {
          //console.log("&&&&&&&& PAGESOURCE/1", routeName, pageName, chunk.name);
          newContent = `
            nextRegisterPageDone = 1;
            window.__NEXT_REGISTER_PAGE('${routeName}', function() {
              var comp = ${content}
              return { page: comp.default }
            })
          `
        }
        //console.log("&&&&&&&& PAGESOURCE/2", routeName, pageName, chunk.name);
        //===== </AKTXYZ>

        // Replace the exisiting chunk with the new content
        compilation.assets[chunk.name] = {
          source: () => newContent,
          size: () => newContent.length
        }

        //===== <AKTXYZ>
        var ttt = (0, _keys2.default)(compilation.assets).filter(function (x) {
          return x.match(/SigninUserPass/) && x.match(/App.User/);
        });
        ttt.unshift('');
        //console.log("=====> AKTXYZ/CHUNKS ", ttt);
        //===== </AKTXYZ>
      })
      callback()
    })
  }
}
