"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");
const searchRows = 20;
async function searchBase(query, page, type) {
    const headers = {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Host: "m.music.migu.cn",
        Referer: `https://m.music.migu.cn/v3/search?keyword=${encodeURIComponent(query)}`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68",
        "X-Requested-With": "XMLHttpRequest",
    };
    const params = {
        keyword: query,
        type,
        pgc: page,
        rows: searchRows,
    };
    const data = await axios_1.default.get("https://m.music.migu.cn/migu/remoting/scr_search_tag", { headers, params });
    return data.data;
}
// function musicCanPlayFilter(_) {
//     return _.lisSQ || _.lisHQ || _.lisBq || _.lisCr || _.lisQq || _.listenUrl ||  _.mp3;
// }
function musicCanPlayFilter(_) {
    return _.mp3 || _.listenUrl || _.lisQq || _.lisCr;
}
async function searchMusic(query, page) {
    const data = await searchBase(query, page, 2);
    const musics = data.musics.map((_) => ({
        id: _.id,
        artwork: _.cover,
        title: _.songName,
        artist: _.artist,
        album: _.albumName,
        url: musicCanPlayFilter(_),
        copyrightId: _.copyrightId,
        singerId: _.singerId,
    }));
    return {
        isEnd: +data.pageNo * searchRows >= data.pgt,
        data: musics,
    };
}
async function searchAlbum(query, page) {
    const data = await searchBase(query, page, 4);
    const albums = data.albums.map((_) => ({
        id: _.id,
        artwork: _.albumPicL,
        title: _.title,
        date: _.publishDate,
        artist: (_.singer || []).map((s) => s.name).join(","),
        singer: _.singer,
        fullSongTotal: _.fullSongTotal,
    }));
    return {
        isEnd: +data.pageNo * searchRows >= data.pgt,
        data: albums,
    };
}
async function searchArtist(query, page) {
    const data = await searchBase(query, page, 1);
    const artists = data.artists.map((result) => ({
        name: result.title,
        id: result.id,
        avatar: result.artistPicL,
        worksNum: result.songNum,
    }));
    return {
        isEnd: +data.pageNo * searchRows >= data.pgt,
        data: artists,
    };
}
async function searchMusicSheet(query, page) {
    const data = await searchBase(query, page, 6);
    const musicsheet = data.songLists.map((result) => ({
        title: result.name,
        id: result.id,
        artist: result.userName,
        artwork: result.img,
        description: result.intro,
        worksNum: result.musicNum,
        playCount: result.playNum,
    }));
    return {
        isEnd: +data.pageNo * searchRows >= data.pgt,
        data: musicsheet,
    };
}
async function searchLyric(query, page) {
    const data = await searchBase(query, page, 7);
    const lyrics = data.songs.map((result) => ({
        title: result.title,
        id: result.id,
        artist: result.artist,
        artwork: result.cover,
        lrc: result.lyrics,
        album: result.albumName,
        copyrightId: result.copyrightId,
    }));
    return {
        isEnd: +data.pageNo * searchRows >= data.pgt,
        data: lyrics,
    };
}
async function getArtistAlbumWorks(artistItem, page) {
    const headers = {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        connection: "keep-alive",
        host: "music.migu.cn",
        referer: "http://music.migu.cn",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
        "Cache-Control": "max-age=0",
    };
    const html = (await axios_1.default.get(`https://music.migu.cn/v3/music/artist/${artistItem.id}/album?page=${page}`, {
        headers,
    })).data;
    const $ = (0, cheerio_1.load)(html);
    const rawAlbums = $("div.artist-album-list").find("li");
    const albums = [];
    for (let i = 0; i < rawAlbums.length; ++i) {
        const al = $(rawAlbums[i]);
        const artwork = al.find(".thumb-img").attr("data-original");
        albums.push({
            id: al.find(".album-play").attr("data-id"),
            title: al.find(".album-name").text(),
            artwork: artwork.startsWith("//") ? `https:${artwork}` : artwork,
            date: "",
            artist: artistItem.name,
        });
    }
    return {
        isEnd: $(".pagination-next").hasClass("disabled"),
        data: albums,
    };
}
async function getArtistWorks(artistItem, page, type) {
    if (type === "music") {
        const headers = {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            Connection: "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Host: "m.music.migu.cn",
            Referer: `https://m.music.migu.cn/migu/l/?s=149&p=163&c=5123&j=l&id=${artistItem.id}`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68",
            "X-Requested-With": "XMLHttpRequest",
        };
        const musicList = (await axios_1.default.get("https://m.music.migu.cn/migu/remoting/cms_artist_song_list_tag", {
            headers,
            params: {
                artistId: artistItem.id,
                pageSize: 20,
                pageNo: page - 1,
            },
        })).data || {};
        return {
            data: musicList.result.results.map((_) => ({
                id: _.songId,
                artwork: _.picL,
                title: _.songName,
                artist: (_.singerName || []).join(", "),
                album: _.albumName,
                url: musicCanPlayFilter(_),
                rawLrc: _.lyricLrc,
                copyrightId: _.copyrightId,
                singerId: _.singerId,
            })),
        };
    }
    else if (type === "album") {
        return getArtistAlbumWorks(artistItem, page);
    }
}
async function getLyric(musicItem) {
    const headers = {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Host: "m.music.migu.cn",
        Referer: `https://m.music.migu.cn/migu/l/?s=149&p=163&c=5200&j=l&id=${musicItem.copyrightId}`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68",
        "X-Requested-With": "XMLHttpRequest",
    };
    const result = (await axios_1.default.get("https://m.music.migu.cn/migu/remoting/cms_detail_tag", {
        headers,
        params: {
            cpid: musicItem.copyrightId,
        },
    })).data;
    return {
        rawLrc: result.data.lyricLrc,
    };
}
async function getMusicSheetInfo(sheet, page) {
    const res = (await axios_1.default.get("https://m.music.migu.cn/migumusic/h5/playlist/songsInfo", {
        params: {
            palylistId: sheet.id,
            pageNo: page,
            pageSize: 30,
        },
        headers: {
            Host: "m.music.migu.cn",
            referer: "https://m.music.migu.cn/v4/music/playlist/",
            By: "7242bd16f68cd9b39c54a8e61537009f",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/113.0.0.0",
        },
    })).data.data;
    if (!res) {
        return {
            isEnd: true,
            musicList: [],
        };
    }
    const isEnd = res.total < 30;
    return {
        isEnd,
        musicList: res.items
            .filter((item) => { var _a; return ((_a = item === null || item === void 0 ? void 0 : item.fullSong) === null || _a === void 0 ? void 0 : _a.vipFlag) === 0; })
            .map((_) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                return ({
                    id: _.id,
                    artwork: ((_a = _.mediumPic) === null || _a === void 0 ? void 0 : _a.startsWith("//"))
                        ? `http:${_.mediumPic}`
                        : _.mediumPic,
                    title: _.name,
                    artist: (_f = (_e = (_d = (_c = (_b = _.singers) === null || _b === void 0 ? void 0 : _b.map) === null || _c === void 0 ? void 0 : _c.call(_b, (_) => _.name)) === null || _d === void 0 ? void 0 : _d.join) === null || _e === void 0 ? void 0 : _e.call(_d, ",")) !== null && _f !== void 0 ? _f : "",
                    album: (_h = (_g = _.album) === null || _g === void 0 ? void 0 : _g.albumName) !== null && _h !== void 0 ? _h : "",
                    copyrightId: _.copyrightId,
                    singerId: (_k = (_j = _.singers) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id,
                });
            }),
    };
}
async function importMusicSheet(urlLike) {
    var _a, _b, _c, _d;
    let id;
    if (!id) {
        id = (urlLike.match(/https?:\/\/music\.migu\.cn\/v3\/(?:my|music)\/playlist\/([0-9]+)/) || [])[1];
    }
    if (!id) {
        id = (urlLike.match(/https?:\/\/h5\.nf\.migu\.cn\/app\/v4\/p\/share\/playlist\/index.html\?.*id=([0-9]+)/) || [])[1];
    }
    if (!id) {
        id = (_a = urlLike.match(/^\s*(\d+)\s*$/)) === null || _a === void 0 ? void 0 : _a[1];
    }
    if (!id) {
        const tempUrl = (_b = urlLike.match(/(https?:\/\/c\.migu\.cn\/[\S]+)\?/)) === null || _b === void 0 ? void 0 : _b[1];
        if (tempUrl) {
            const request = (await axios_1.default.get(tempUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.61",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    host: "c.migu.cn",
                },
                validateStatus(status) {
                    return (status >= 200 && status < 300) || status === 403;
                },
            })).request;
            const realpath = (_c = request === null || request === void 0 ? void 0 : request.path) !== null && _c !== void 0 ? _c : request === null || request === void 0 ? void 0 : request.responseURL;
            if (realpath) {
                id = (_d = realpath.match(/id=(\d+)/)) === null || _d === void 0 ? void 0 : _d[1];
            }
        }
    }
    if (!id) {
        return;
    }
    const headers = {
        host: "m.music.migu.cn",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://m.music.migu.cn",
    };
    const res = (await axios_1.default.get(`https://m.music.migu.cn/migu/remoting/query_playlist_by_id_tag?onLine=1&queryChannel=0&createUserId=migu&contentCountMin=5&playListId=${id}`, {
        headers,
    })).data;
    const contentCount = parseInt(res.rsp.playList[0].contentCount);
    const cids = [];
    let pageNo = 1;
    while ((pageNo - 1) * 20 < contentCount) {
        const listPage = (await axios_1.default.get(`https://music.migu.cn/v3/music/playlist/${id}?page=${pageNo}`)).data;
        const $ = (0, cheerio_1.load)(listPage);
        $(".row.J_CopySong").each((i, v) => {
            cids.push($(v).attr("data-cid"));
        });
        pageNo += 1;
    }
    if (cids.length === 0) {
        return;
    }
    const songs = (await (0, axios_1.default)({
        url: `https://music.migu.cn/v3/api/music/audioPlayer/songs?type=1&copyrightId=${cids.join(",")}`,
        headers: {
            referer: "http://m.music.migu.cn/v3",
        },
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    })).data;
    return songs.items
        .filter((_) => _.vipFlag === 0)
        .map((_) => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                id: _.songId,
                artwork: _.cover,
                title: _.songName,
                artist: (_b = (_a = _.singers) === null || _a === void 0 ? void 0 : _a.map((_) => _.artistName)) === null || _b === void 0 ? void 0 : _b.join(", "),
                album: (_d = (_c = _.albums) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.albumName,
                copyrightId: _.copyrightId,
                singerId: (_f = (_e = _.singers) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.artistId,
            });
        });
}
async function getTopLists() {
    const jianjiao = {
        title: "咪咕尖叫榜",
        data: [
            {
                id: "jianjiao_newsong",
                title: "尖叫新歌榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/02/36/20020512065402_360x360_2997.png",
            },
            {
                id: "jianjiao_hotsong",
                title: "尖叫热歌榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/04/99/200408163640868_360x360_6587.png",
            },
            {
                id: "jianjiao_original",
                title: "尖叫原创榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/04/99/200408163702795_360x360_1614.png",
            },
        ],
    };
    const tese = {
        title: "咪咕特色榜",
        data: [
            {
                id: "movies",
                title: "影视榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/05/136/200515161848938_360x360_673.png",
            },
            {
                id: "mainland",
                title: "内地榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095104122_327x327_4971.png",
            },
            {
                id: "hktw",
                title: "港台榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095125191_327x327_2382.png",
            },
            {
                id: "eur_usa",
                title: "欧美榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095229556_327x327_1383.png",
            },
            {
                id: "jpn_kor",
                title: "日韩榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095259569_327x327_4628.png",
            },
            {
                id: "coloring",
                title: "彩铃榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095356693_327x327_7955.png",
            },
            {
                id: "ktv",
                title: "KTV榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095414420_327x327_4992.png",
            },
            {
                id: "network",
                title: "网络榜",
                coverImg: "https://cdnmusic.migu.cn/tycms_picture/20/08/231/200818095442606_327x327_1298.png",
            },
        ],
    };
    return [jianjiao, tese];
}
const UA = "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68";
const By = CryptoJS.MD5(UA).toString();
async function getTopListDetail(topListItem) {
    const res = await axios_1.default.get(`https://m.music.migu.cn/migumusic/h5/billboard/home`, {
        params: {
            pathName: topListItem.id,
            pageNum: 1,
            pageSize: 100,
        },
        headers: {
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            Host: "m.music.migu.cn",
            referer: `https://m.music.migu.cn/v4/music/top/${topListItem.id}`,
            "User-Agent": UA,
            By,
        },
    });
    return Object.assign(Object.assign({}, topListItem), {
        musicList: res.data.data.songs.items
            .map((_) => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    id: _.id,
                    artwork: ((_a = _.mediumPic) === null || _a === void 0 ? void 0 : _a.startsWith("//"))
                        ? `https:${_.mediumPic}`
                        : _.mediumPic,
                    title: _.name,
                    artist: (_c = (_b = _.singers) === null || _b === void 0 ? void 0 : _b.map((_) => _.name)) === null || _c === void 0 ? void 0 : _c.join(", "),
                    album: (_d = _.album) === null || _d === void 0 ? void 0 : _d.albumName,
                    copyrightId: _.copyrightId,
                    singerId: (_f = (_e = _.singers) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.id,
                });
            })
    });
}
async function getRecommendSheetTags() {
    const allTags = (await axios_1.default.get("https://m.music.migu.cn/migumusic/h5/playlist/allTag", {
        headers: {
            host: "m.music.migu.cn",
            referer: "https://m.music.migu.cn/v4/music/playlist",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/113.0.0.0",
            By: "7242bd16f68cd9b39c54a8e61537009f",
        },
    })).data.data.tags;
    const data = allTags.map((_) => {
        return {
            title: _.tagName,
            data: _.tags.map((_) => ({
                id: _.tagId,
                title: _.tagName,
            })),
        };
    });
    return {
        pinned: [
            {
                title: "小清新",
                id: "1000587673",
            },
            {
                title: "电视剧",
                id: "1001076078",
            },
            {
                title: "民谣",
                id: "1000001775",
            },
            {
                title: "旅行",
                id: "1000001749",
            },
            {
                title: "思念",
                id: "1000001703",
            },
        ],
        data,
    };
}
async function getRecommendSheetsByTag(sheetItem, page) {
    const pageSize = 20;
    const res = (await axios_1.default.get("https://m.music.migu.cn/migumusic/h5/playlist/list", {
        params: {
            columnId: 15127272,
            tagId: sheetItem.id,
            pageNum: page,
            pageSize,
        },
        headers: {
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/113.0.0.0",
            host: "m.music.migu.cn",
            By: "7242bd16f68cd9b39c54a8e61537009f",
            Referer: "https://m.music.migu.cn/v4/music/playlist",
        },
    })).data.data;
    const isEnd = page * pageSize > res.total;
    const data = res.items.map((_) => ({
        id: _.playListId,
        artist: _.createUserName,
        title: _.playListName,
        artwork: _.image.startsWith("//") ? `http:${_.image}` : _.image,
        playCount: _.playCount,
        createUserId: _.createUserId,
    }));
    return {
        isEnd,
        data,
    };
}
async function getMediaSourceByMTM(musicItem, quality) {
    if (quality === "standard" && musicItem.url) {
        return {
            url: musicItem.url,
        };
    }
    else if (quality === "standard") {
        const headers = {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            Connection: "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Host: "m.music.migu.cn",
            Referer: `https://m.music.migu.cn/migu/l/?s=149&p=163&c=5200&j=l&id=${musicItem.copyrightId}`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68",
            "X-Requested-With": "XMLHttpRequest",
        };
        const result = (await axios_1.default.get("https://m.music.migu.cn/migu/remoting/cms_detail_tag", {
            headers,
            params: {
                cpid: musicItem.copyrightId,
            },
        })).data.data;
        return {
            artwork: musicItem.artwork || result.picL,
            url: result.listenUrl || result.listenQq || result.lisCr,
        };
    }
}
const qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "320k",
    super: "320k",
};
async function getMediaSource(musicItem, quality) {
    const res = (
        await axios_1.default.get(`https://lxmusicapi.onrender.com/url/mg/${musicItem.id}/${qualityLevels[quality]}`, {
            headers: {
                "X-Request-Key": "share-v2"
            },
        })
    ).data;
    return {
        url: res.url,
    };
}
module.exports = {
    platform: "小蜜音乐",
    author: "Huibq",
    version: "0.3.0",
    appVersion: ">0.1.0-alpha.0",
    hints: {
        importMusicSheet: [
            "咪咕APP：自建歌单-分享-复制链接，直接粘贴即可",
            "H5/PC端：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入时间和歌单大小有关，请耐心等待",
        ],
    },
    primaryKey: ["id", "copyrightId"],
    cacheControl: "cache",
    srcUrl: "https://raw.niuma666bet.buzz/Huibq/keep-alive/master/Music_Free/xiaomi.js",
    supportedSearchType: ["music", "album", "sheet", "artist", "lyric"],
    getMediaSource,
    async search(query, page, type) {
        if (type === "music") {
            return await searchMusic(query, page);
        }
        if (type === "album") {
            return await searchAlbum(query, page);
        }
        if (type === "artist") {
            return await searchArtist(query, page);
        }
        if (type === "sheet") {
            return await searchMusicSheet(query, page);
        }
        if (type === "lyric") {
            return await searchLyric(query, page);
        }
    },
    async getAlbumInfo(albumItem) {
        const headers = {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            Connection: "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Host: "m.music.migu.cn",
            Referer: `https://m.music.migu.cn/migu/l/?record=record&id=${albumItem.id}`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68",
            "X-Requested-With": "XMLHttpRequest",
        };
        const musicList = (await axios_1.default.get("https://m.music.migu.cn/migu/remoting/cms_album_song_list_tag", {
            headers,
            params: {
                albumId: albumItem.id,
                pageSize: 30,
            },
        })).data || {};
        const albumDesc = (await axios_1.default.get("https://m.music.migu.cn/migu/remoting/cms_album_detail_tag", {
            headers,
            params: {
                albumId: albumItem.id,
            },
        })).data || {};
        return {
            albumItem: { description: albumDesc.albumIntro },
            musicList: musicList.result.results
                .map((_) => ({
                    id: _.songId,
                    artwork: _.picL,
                    title: _.songName,
                    artist: (_.singerName || []).join(", "),
                    album: albumItem.title,
                    url: musicCanPlayFilter(_),
                    rawLrc: _.lyricLrc,
                    copyrightId: _.copyrightId,
                    singerId: _.singerId,
                })),
        };
    },
    getArtistWorks: getArtistWorks,
    getLyric: getLyric,
    importMusicSheet,
    getTopLists,
    getTopListDetail,
    getRecommendSheetTags,
    getRecommendSheetsByTag,
    getMusicSheetInfo,
};
