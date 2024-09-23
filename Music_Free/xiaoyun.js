"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const CryptoJs = require("crypto-js");
const qs = require("qs");
const bigInt = require("big-integer");
const dayjs = require("dayjs");
const cheerio = require("cheerio");
function create_key() {
    var d, e, b = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", c = "";
    for (d = 0; 16 > d; d += 1)
        (e = Math.random() * b.length), (e = Math.floor(e)), (c += b.charAt(e));
    return c;
}
function AES(a, b) {
    var c = CryptoJs.enc.Utf8.parse(b), d = CryptoJs.enc.Utf8.parse("0102030405060708"), e = CryptoJs.enc.Utf8.parse(a), f = CryptoJs.AES.encrypt(e, c, {
        iv: d,
        mode: CryptoJs.mode.CBC,
    });
    return f.toString();
}
function Rsa(text) {
    text = text.split("").reverse().join("");
    const d = "010001";
    const e = "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7";
    const hexText = text
        .split("")
        .map((_) => _.charCodeAt(0).toString(16))
        .join("");
    const res = bigInt(hexText, 16)
        .modPow(bigInt(d, 16), bigInt(e, 16))
        .toString(16);
    return Array(256 - res.length)
        .fill("0")
        .join("")
        .concat(res);
}
function getParamsAndEnc(text) {
    const first = AES(text, "0CoJUm6Qyw8W8jud");
    const rand = create_key();
    const params = AES(first, rand);
    const encSecKey = Rsa(rand);
    return {
        params,
        encSecKey,
    };
}
function formatMusicItem(_) {
    var _a, _b, _c, _d;
    const album = _.al || _.album;
    return {
        id: _.id,
        artwork: album === null || album === void 0 ? void 0 : album.picUrl,
        title: _.name,
        artist: (_.ar || _.artists)[0].name,
        album: album === null || album === void 0 ? void 0 : album.name,
        url: `https://share.duanx.cn/url/wy/${_.id}/128k`,
        qualities: {
            low: {
                size: (_a = (_.l || {})) === null || _a === void 0 ? void 0 : _a.size,
            },
            standard: {
                size: (_b = (_.m || {})) === null || _b === void 0 ? void 0 : _b.size,
            },
            high: {
                size: (_c = (_.h || {})) === null || _c === void 0 ? void 0 : _c.size,
            },
            super: {
                size: (_d = (_.sq || {})) === null || _d === void 0 ? void 0 : _d.size,
            },
        },
        copyrightId: _ === null || _ === void 0 ? void 0 : _.copyrightId
    };
}
function formatAlbumItem(_) {
    return {
        id: _.id,
        artist: _.artist.name,
        title: _.name,
        artwork: _.picUrl,
        description: "",
        date: dayjs.unix(_.publishTime / 1000).format("YYYY-MM-DD"),
    };
}
const pageSize = 30;
async function searchBase(query, page, type) {
    const data = {
        s: query,
        limit: pageSize,
        type: type,
        offset: (page - 1) * pageSize,
        csrf_token: "",
    };
    const pae = getParamsAndEnc(JSON.stringify(data));
    const paeData = qs.stringify(pae);
    const headers = {
        authority: "music.163.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "content-type": "application/x-www-form-urlencoded",
        accept: "*/*",
        origin: "https://music.163.com",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://music.163.com/search/",
        "accept-language": "zh-CN,zh;q=0.9",
    };
    const res = (await (0, axios_1.default)({
        method: "post",
        url: "https://music.163.com/weapi/search/get",
        headers,
        data: paeData,
    })).data;
    return res;
}
async function searchMusic(query, page) {
    const res = await searchBase(query, page, 1);
    const songs = res.result.songs
        .map(formatMusicItem);
    return {
        isEnd: res.result.songCount <= page * pageSize,
        data: songs,
    };
}
async function searchAlbum(query, page) {
    const res = await searchBase(query, page, 10);
    const albums = res.result.albums.map(formatAlbumItem);
    return {
        isEnd: res.result.albumCount <= page * pageSize,
        data: albums,
    };
}
async function searchArtist(query, page) {
    const res = await searchBase(query, page, 100);
    const artists = res.result.artists.map((_) => ({
        name: _.name,
        id: _.id,
        avatar: _.img1v1Url,
        worksNum: _.albumSize,
    }));
    return {
        isEnd: res.result.artistCount <= page * pageSize,
        data: artists,
    };
}
async function searchMusicSheet(query, page) {
    const res = await searchBase(query, page, 1000);
    const playlists = res.result.playlists.map((_) => {
        var _a;
        return ({
            title: _.name,
            id: _.id,
            coverImg: _.coverImgUrl,
            artist: (_a = _.creator) === null || _a === void 0 ? void 0 : _a.nickname,
            playCount: _.playCount,
            worksNum: _.trackCount,
        });
    });
    return {
        isEnd: res.result.playlistCount <= page * pageSize,
        data: playlists,
    };
}
async function searchLyric(query, page) {
    var _a, _b;
    const res = await searchBase(query, page, 1006);
    const lyrics = (_b = (_a = res.result.songs) === null || _a === void 0 ? void 0 : _a.map((it) => {
        var _a, _b, _c, _d;
        return ({
            title: it.name,
            artist: (_a = it.ar) === null || _a === void 0 ? void 0 : _a.map((_) => _.name).join(", "),
            id: it.id,
            artwork: (_b = it.al) === null || _b === void 0 ? void 0 : _b.picUrl,
            album: (_c = it.al) === null || _c === void 0 ? void 0 : _c.name,
            rawLrcTxt: (_d = it.lyrics) === null || _d === void 0 ? void 0 : _d.join("\n"),
        });
    })) !== null && _b !== void 0 ? _b : [];
    return {
        isEnd: res.result.songCount <= page * pageSize,
        data: lyrics,
    };
}
async function getArtistWorks(artistItem, page, type) {
    const data = {
        csrf_token: "",
    };
    const pae = getParamsAndEnc(JSON.stringify(data));
    const paeData = qs.stringify(pae);
    const headers = {
        authority: "music.163.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "content-type": "application/x-www-form-urlencoded",
        accept: "*/*",
        origin: "https://music.163.com",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://music.163.com/search/",
        "accept-language": "zh-CN,zh;q=0.9",
    };
    if (type === "music") {
        const res = (await (0, axios_1.default)({
            method: "post",
            url: `https://music.163.com/weapi/v1/artist/${artistItem.id}?csrf_token=`,
            headers,
            data: paeData,
        })).data;
        return {
            isEnd: true,
            data: res.hotSongs.map(formatMusicItem),
        };
    }
    else if (type === "album") {
        const res = (await (0, axios_1.default)({
            method: "post",
            url: `https://music.163.com/weapi/artist/albums/${artistItem.id}?csrf_token=`,
            headers,
            data: paeData,
        })).data;
        return {
            isEnd: true,
            data: res.hotAlbums.map(formatAlbumItem),
        };
    }
}
async function getTopListDetail(topListItem) {
    const musicList = await getSheetMusicById(topListItem.id);
    return Object.assign(Object.assign({}, topListItem), { musicList });
}
async function getLyric(musicItem) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
    };
    const data = { id: musicItem.id, lv: -1, tv: -1, csrf_token: "" };
    const pae = getParamsAndEnc(JSON.stringify(data));
    const paeData = qs.stringify(pae);
    const result = (await (0, axios_1.default)({
        method: "post",
        url: `https://interface.music.163.com/weapi/song/lyric?csrf_token=`,
        headers,
        data: paeData,
    })).data;
    return {
        rawLrc: result.lrc.lyric,
    };
}
async function getMusicInfo(musicItem) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
    };
    const data = { id: musicItem.id, ids: `[${musicItem.id}]` };
    const result = (await axios_1.get('http://music.163.com/api/song/detail',
        {
            headers,
            params: data
        })).data;
    return {
        artwork: result.songs[0].album.picUrl,
    };
}
async function getAlbumInfo(albumItem) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
    };
    const data = {
        resourceType: 3,
        resourceId: albumItem.id,
        limit: 15,
        csrf_token: "",
    };
    const pae = getParamsAndEnc(JSON.stringify(data));
    const paeData = qs.stringify(pae);
    const res = (await (0, axios_1.default)({
        method: "post",
        url: `https://interface.music.163.com/weapi/v1/album/${albumItem.id}?csrf_token=`,
        headers,
        data: paeData,
    })).data;
    return {
        albumItem: { description: res.album.description },
        musicList: (res.songs || [])
            .map(formatMusicItem),
    };
}
async function getValidMusicItems(trackIds) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
    };
    try {
        // 获取歌曲详情数据
        const res = (await axios_1.default.get(`https://music.163.com/api/song/detail/?ids=[${trackIds.join(",")}]`, { headers })).data;
        // 直接格式化歌曲项，不检查 URL
        const validMusicItems = res.songs.map(formatMusicItem);
        return validMusicItems;
    }
    catch (e) {
        console.error(e);
        return [];
    }
}

async function getSheetMusicById(id) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
    };
    const sheetDetail = (await axios_1.default.get(`https://music.163.com/api/v3/playlist/detail?id=${id}&n=5000`, {
        headers,
    })).data;
    const trackIds = sheetDetail.playlist.trackIds.map((_) => _.id);
    let result = [];
    let idx = 0;
    while (idx * 200 < trackIds.length) {
        const res = await getValidMusicItems(trackIds.slice(idx * 200, (idx + 1) * 200));
        result = result.concat(res);
        ++idx;
    }
    return result;
}
async function importMusicSheet(urlLike) {
    const matchResult = urlLike.match(/(?:https:\/\/y\.music\.163.com\/m\/playlist\?id=([0-9]+))|(?:https?:\/\/music\.163\.com\/playlist\/([0-9]+)\/.*)|(?:https?:\/\/music.163.com(?:\/#)?\/playlist\?id=(\d+))|(?:^\s*(\d+)\s*$)/);
    const id = matchResult[1] || matchResult[2] || matchResult[3] || matchResult[4];
    return getSheetMusicById(id);
}
async function getTopLists() {
    const res = await axios_1.default.get("https://music.163.com/discover/toplist", {
        headers: {
            referer: "https://music.163.com/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54",
        },
    });
    const $ = cheerio.load(res.data);
    const children = $(".n-minelst").children();
    const groups = [];
    let currentGroup = {};
    for (let c of children) {
        if (c.tagName == "h2") {
            if (currentGroup.title) {
                groups.push(currentGroup);
            }
            currentGroup = {};
            currentGroup.title = $(c).text();
            currentGroup.data = [];
        }
        else if (c.tagName === "ul") {
            let sections = $(c).children();
            currentGroup.data = sections
                .map((index, element) => {
                    const ele = $(element);
                    const id = ele.attr("data-res-id");
                    const coverImg = ele.find("img").attr("src").replace(/(\.jpg\?).*/, ".jpg?param=800y800");
                    const title = ele.find("p.name").text();
                    const description = ele.find("p.s-fc4").text();
                    return {
                        id,
                        coverImg,
                        title,
                        description,
                    };
                })
                .toArray();
        }
    }
    if (currentGroup.title) {
        groups.push(currentGroup);
    }
    return groups;
}
const qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "320k",
    super: "320k",
};
async function getMediaSource(musicItem, quality) {
    const res = (
        await axios_1.default.get(`https://lxmusicapi.onrender.com/url/wy/${musicItem.id}/${qualityLevels[quality]}`, {
            headers: {
                "X-Request-Key": "share-v2"
            },
        })
    ).data;
    return {
        url: res.url,
    };
}
const headers = {
    authority: "music.163.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
    "content-type": "application/x-www-form-urlencoded",
    accept: "*/*",
    origin: "https://music.163.com",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    referer: "https://music.163.com/",
    "accept-language": "zh-CN,zh;q=0.9",
};
async function getRecommendSheetTags() {
    const data = {
        csrf_token: "",
    };
    const pae = getParamsAndEnc(JSON.stringify(data));
    const paeData = qs.stringify(pae);
    const res = (await (0, axios_1.default)({
        method: "post",
        url: "https://music.163.com/weapi/playlist/catalogue",
        headers,
        data: paeData,
    })).data;
    const cats = res.categories;
    const map = {};
    const catData = Object.entries(cats).map((_) => {
        const tagData = {
            title: _[1],
            data: [],
        };
        map[_[0]] = tagData;
        return tagData;
    });
    const pinned = [];
    res.sub.forEach((tag) => {
        const _tag = {
            id: tag.name,
            title: tag.name,
        };
        if (tag.hot) {
            pinned.push(_tag);
        }
        map[tag.category].data.push(_tag);
    });
    return {
        pinned,
        data: catData,
    };
}
async function getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    const data = {
        cat: tag.id || "全部",
        order: "hot",
        limit: pageSize,
        offset: (page - 1) * pageSize,
        total: true,
        csrf_token: "",
    };
    const pae = getParamsAndEnc(JSON.stringify(data));
    const paeData = qs.stringify(pae);
    const res = (await (0, axios_1.default)({
        method: "post",
        url: "https://music.163.com/weapi/playlist/list",
        headers,
        data: paeData,
    })).data;
    const playLists = res.playlists.map((_) => ({
        id: _.id,
        artist: _.creator.nickname,
        title: _.name,
        artwork: _.coverImgUrl,
        playCount: _.playCount,
        createUserId: _.userId,
        createTime: _.createTime,
        description: _.description,
    }));
    return {
        isEnd: !(res.more === true),
        data: playLists,
    };
}
async function getMusicSheetInfo(sheet, page) {
    let trackIds = sheet._trackIds;
    if (!trackIds) {
        const id = sheet.id;
        const headers = {
            Referer: "https://y.music.163.com/",
            Origin: "https://y.music.163.com/",
            authority: "music.163.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        };
        const sheetDetail = (await axios_1.default.get(`https://music.163.com/api/v3/playlist/detail?id=${id}&n=5000`, {
            headers,
        })).data;
        trackIds = sheetDetail.playlist.trackIds.map((_) => _.id);
    }
    const pageSize = 40;
    const currentPageIds = trackIds.slice((page - 1) * pageSize, page * pageSize);
    const res = await getValidMusicItems(currentPageIds);
    let extra = {};
    if (page <= 1) {
        extra = {
            _trackIds: trackIds,
        };
    }
    return Object.assign({ isEnd: trackIds.length <= page * pageSize, musicList: res }, extra);
}
module.exports = {
    platform: "小芸音乐",
    author: 'Huibq',
    version: "0.3.0",
    appVersion: ">0.1.0-alpha.0",
    srcUrl: "https://raw.niuma666bet.buzz/Huibq/keep-alive/master/Music_Free/xiaoyun.js",
    cacheControl: "no-store",
    hints: {
        importMusicSheet: [
            "网易云：APP点击分享，然后复制链接",
            "默认歌单无法导入，先新建一个空白歌单复制过去再导入新歌单即可"
        ],
    },
    supportedSearchType: ["music", "album", "sheet", "artist", "lyric"],
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
    getMediaSource,
    getMusicInfo,
    getAlbumInfo,
    getLyric,
    getArtistWorks,
    importMusicSheet,
    getTopLists,
    getTopListDetail,
    getRecommendSheetTags,
    getMusicSheetInfo,
    getRecommendSheetsByTag,
};