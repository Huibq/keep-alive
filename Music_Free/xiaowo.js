"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const he = require("he");
const pageSize = 30;
function artworkShort2Long(albumpicShort) {
    var _a;
    const firstSlashOfAlbum = (_a = albumpicShort === null || albumpicShort === void 0 ? void 0 : albumpicShort.indexOf("/")) !== null && _a !== void 0 ? _a : -1;
    return firstSlashOfAlbum !== -1
        ? `https://img4.kuwo.cn/star/albumcover/1080${albumpicShort.slice(firstSlashOfAlbum)}`
        : undefined;
}
function formatMusicItem(_) {
    return {
        id: _.MUSICRID.replace("MUSIC_", ""),
        artwork: artworkShort2Long(_.web_albumpic_short),
        title: he.decode(_.NAME || ""),
        artist: he.decode(_.ARTIST || ""),
        album: he.decode(_.ALBUM || ""),
        albumId: _.ALBUMID,
        artistId: _.ARTISTID,
        formats: _.FORMATS,
    };
}
function formatAlbumItem(_) {
    var _a;
    return {
        id: _.albumid,
        artist: he.decode(_.artist || ""),
        title: he.decode(_.name || ""),
        artwork: (_a = _.img) !== null && _a !== void 0 ? _a : artworkShort2Long(_.pic),
        description: he.decode(_.info || ""),
        date: _.pub,
        artistId: _.artistid,
    };
}
function formatArtistItem(_) {
    return {
        id: _.ARTISTID,
        avatar: _.hts_PICPATH,
        name: he.decode(_.ARTIST || ""),
        artistId: _.ARTISTID,
        description: he.decode(_.desc || ""),
        worksNum: _.SONGNUM
    };
}
function formatMusicSheet(_) {
    return {
        id: _.playlistid,
        title: he.decode(_.name || ""),
        artist: he.decode(_.nickname || ""),
        artwork: _.pic,
        playCount: _.playcnt,
        description: he.decode(_.intro || ""),
        worksNum: _.songnum,
    };
}
async function searchMusic(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            client: "kt",
            all: query,
            pn: page - 1,
            rn: pageSize,
            uid: 2574109560,
            ver: "kwplayer_ar_8.5.4.2",
            vipver: 1,
            ft: "music",
            cluster: 0,
            strategy: 2012,
            encoding: "utf8",
            rformat: "json",
            vermerge: 1,
            mobi: 1,
        },
    })).data;
    const songs = res.abslist.map(formatMusicItem);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: songs,
    };
}
async function searchAlbum(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query,
            ft: "album",
            itemset: "web_2013",
            client: "kt",
            pn: page - 1,
            rn: pageSize,
            rformat: "json",
            encoding: "utf8",
            pcjson: 1,
        },
    })).data;
    const albums = res.albumlist.map(formatAlbumItem);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: albums,
    };
}
async function searchArtist(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query,
            ft: "artist",
            itemset: "web_2013",
            client: "kt",
            pn: page - 1,
            rn: pageSize,
            rformat: "json",
            encoding: "utf8",
            pcjson: 1,
        },
    })).data;
    const artists = res.abslist.map(formatArtistItem);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: artists,
    };
}
async function searchMusicSheet(query, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query,
            ft: "playlist",
            itemset: "web_2013",
            client: "kt",
            pn: page - 1,
            rn: pageSize,
            rformat: "json",
            encoding: "utf8",
            pcjson: 1,
        },
    })).data;
    const musicSheets = res.abslist.map(formatMusicSheet);
    return {
        isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL,
        data: musicSheets,
    };
}
async function getArtistMusicWorks(artistItem, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: page - 1,
            rn: pageSize,
            artistid: artistItem.id,
            stype: "artist2music",
            sortby: 0,
            alflac: 1,
            show_copyright_off: 1,
            pcmp4: 1,
            encoding: "utf8",
            plat: "pc",
            thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2",
            devid: "38668888",
            newver: 1,
            pcjson: 1,
        },
    })).data;
    const songs = res.musiclist.map((_) => {
        return {
            id: _.musicrid,
            artwork: artworkShort2Long(_.web_albumpic_short),
            title: he.decode(_.name || ""),
            artist: he.decode(_.artist || ""),
            album: he.decode(_.album || ""),
            albumId: _.albumid,
            artistId: _.artistid,
            formats: _.formats,
        };
    });
    return {
        isEnd: (+res.pn + 1) * pageSize >= +res.total,
        data: songs,
    };
}
async function getArtistAlbumWorks(artistItem, page) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: page - 1,
            rn: pageSize,
            artistid: artistItem.id,
            stype: "albumlist",
            sortby: 1,
            alflac: 1,
            show_copyright_off: 1,
            pcmp4: 1,
            encoding: "utf8",
            plat: "pc",
            thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2",
            devid: "38668888",
            newver: 1,
            pcjson: 1,
        },
    })).data;
    const albums = res.albumlist.map(formatAlbumItem);
    return {
        isEnd: (+res.pn + 1) * pageSize >= +res.total,
        data: albums,
    };
}
async function getArtistWorks(artistItem, page, type) {
    if (type === "music") {
        return getArtistMusicWorks(artistItem, page);
    }
    else if (type === "album") {
        return getArtistAlbumWorks(artistItem, page);
    }
}
async function getLyric(musicItem) {
    const res = (await axios_1.default.get("http://m.kuwo.cn/newh5/singles/songinfoandlrc", {
        params: {
            musicId: musicItem.id,
            httpStatus: 1,
        },
    })).data;
    const list = res.data.lrclist;
    return {
        rawLrc: list.map((_) => `[${_.time}]${_.lineLyric}`).join("\n"),
    };
}
async function getAlbumInfo(albumItem) {
    const res = (await (0, axios_1.default)({
        method: "get",
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: 0,
            rn: 100,
            albumid: albumItem.id,
            stype: "albuminfo",
            sortby: 0,
            alflac: 1,
            show_copyright_off: 1,
            pcmp4: 1,
            encoding: "utf8",
            plat: "pc",
            thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2",
            devid: "38668888",
            newver: 1,
            pcjson: 1,
        },
    })).data;
    const songs = res.musiclist.map((_) => {
        var _a;
        return {
            id: _.id,
            artwork: (_a = albumItem.artwork) !== null && _a !== void 0 ? _a : res.img,
            title: he.decode(_.name || ""),
            artist: he.decode(_.artist || ""),
            album: he.decode(_.album || ""),
            albumId: albumItem.id,
            artistId: _.artistid,
            formats: _.formats,
        };
    });
    return {
        musicList: songs,
    };
}
async function getTopLists() {
    const result = (await axios_1.default.get("http://wapi.kuwo.cn/api/pc/bang/list")).data
        .child;
    return result.map((e) => ({
        title: e.disname,
        data: e.child.map((_) => {
            var _a, _b;
            return ({
                id: _.sourceid,
                coverImg: (_b = (_a = _.pic5) !== null && _a !== void 0 ? _a : _.pic2) !== null && _b !== void 0 ? _b : _.pic,
                title: _.name,
                description: _.intro,
            });
        }),
    }));
}
async function getTopListDetail(topListItem) {
    const res = await axios_1.default.get(`http://kbangserver.kuwo.cn/ksong.s`, {
        params: {
            from: "pc",
            fmt: "json",
            pn: 0,
            rn: 80,
            type: "bang",
            data: "content",
            id: topListItem.id,
            show_copyright_off: 0,
            pcmp4: 1,
            isbang: 1,
            userid: 0,
            httpStatus: 1,
        },
    });
    return Object.assign(Object.assign({}, topListItem), {
        musicList: res.data.musiclist.map((_) => {
            return {
                id: _.id,
                title: he.decode(_.name || ""),
                artist: he.decode(_.artist || ""),
                album: he.decode(_.album || ""),
                albumId: _.albumid,
                artistId: _.artistid,
                formats: _.formats,
            };
        })
    });
}
async function getMusicSheetResponseById(id, page, pagesize = 50) {
    return (await axios_1.default.get(`http://nplserver.kuwo.cn/pl.svc`, {
        params: {
            op: "getlistinfo",
            pid: id,
            pn: page - 1,
            rn: pagesize,
            encode: "utf8",
            keyset: "pl2012",
            vipver: "MUSIC_9.1.1.2_BCS2",
            newver: 1,
        },
    })).data;
}
async function importMusicSheet(urlLike) {
    var _a, _b;
    let id;
    if (!id) {
        id = (_a = urlLike.match(/https?:\/\/www\/kuwo\.cn\/playlist_detail\/(\d+)/)) === null || _a === void 0 ? void 0 : _a[1];
    }
    if (!id) {
        id = (_b = urlLike.match(/https?:\/\/m\.kuwo\.cn\/h5app\/playlist\/(\d+)/)) === null || _b === void 0 ? void 0 : _b[1];
    }
    if (!id) {
        id = urlLike.match(/^\s*(\d+)\s*$/);
    }
    if (!id) {
        return;
    }
    let page = 1;
    let totalPage = 30;
    let musicList = [];
    while (page < totalPage) {
        try {
            const data = await getMusicSheetResponseById(id, page, 80);
            totalPage = Math.ceil(data.total / 80);
            if (isNaN(totalPage)) {
                totalPage = 1;
            }
            musicList = musicList.concat(data.musicList.map((_) => ({
                id: _.id,
                title: he.decode(_.name || ""),
                artist: he.decode(_.artist || ""),
                album: he.decode(_.album || ""),
                albumId: _.albumid,
                artistId: _.artistid,
                formats: _.formats,
            })));
        }
        catch (_c) { }
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 200 + Math.random() * 100);
        });
        ++page;
    }
    return musicList;
}
async function getRecommendSheetTags() {
    const res = (await axios_1.default.get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576`)).data.data;
    const data = res
        .map((group) => ({
            title: group.name,
            data: group.data.map((_) => ({
                id: _.id,
                digest: _.digest,
                title: _.name,
            })),
        }))
        .filter((item) => item.data.length);
    const pinned = [
        {
            id: "1848",
            title: "翻唱",
            digest: "10000",
        },
        {
            id: "621",
            title: "网络",
            digest: "10000",
        },
        {
            title: "伤感",
            digest: "10000",
            id: "146",
        },
        {
            title: "欧美",
            digest: "10000",
            id: "35",
        },
    ];
    return {
        data,
        pinned,
    };
}
async function getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    let res;
    if (tag.id) {
        if (tag.digest === "10000") {
            res = (await axios_1.default.get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page - 1}&id=${tag.id}&rn=${pageSize}`)).data.data;
        }
        else {
            let digest43Result = (await axios_1.default.get(`http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${tag.id}&prod=pc`)).data;
            res = {
                total: 0,
                data: digest43Result.reduce((prev, curr) => [...prev, ...curr.list]),
            };
        }
    }
    else {
        res = (await axios_1.default.get(`https://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page - 1}&rn=${pageSize}&order=hot`)).data.data;
    }
    const isEnd = page * pageSize >= res.total;
    return {
        isEnd,
        data: res.data.map((_) => ({
            title: _.name,
            artist: _.uname,
            id: _.id,
            artwork: _.img,
            playCount: _.listencnt,
            createUserId: _.uid,
        })),
    };
}
async function getMusicSheetInfo(sheet, page) {
    const res = await getMusicSheetResponseById(sheet.id, page, pageSize);
    return {
        isEnd: page * pageSize >= res.total,
        musicList: res.musiclist.map((_) => ({
            id: _.id,
            title: he.decode(_.name || ""),
            artist: he.decode(_.artist || ""),
            album: he.decode(_.album || ""),
            albumId: _.albumid,
            artistId: _.artistid,
            formats: _.formats,
        })),
    };
}
const qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "320k",
    super: "320k",
};
async function getMediaSource(musicItem, quality) {
    const res = (
        await axios_1.default.get(`https://lxmusicapi.onrender.com/url/kw/${musicItem.id}/${qualityLevels[quality]}`, {
            headers: {
                "X-Request-Key": "share-v2"
            },
        })
    ).data;
    return {
        url: res.url,
    };
}
async function getMusicInfo(musicItem) {
    const res = (await axios_1.default.get("http://m.kuwo.cn/newh5/singles/songinfoandlrc", {
        params: {
            musicId: musicItem.id,
            httpStatus: 1,
        },
    })).data;
    const originalUrl = res.data.songinfo.pic;
    let picUrl;
    if (originalUrl.includes("starheads/")) {
        picUrl = originalUrl.replace(/starheads\/\d+/, "starheads/800");
    }
    else if (originalUrl.includes("albumcover/")) {
        picUrl = originalUrl.replace(/albumcover\/\d+/, "albumcover/800");
    }
    return {
        artwork: picUrl,
    };
}
module.exports = {
    platform: "小蜗音乐",
    author: 'Huibq',
    version: "0.3.0",
    appVersion: ">0.1.0-alpha.0",
    srcUrl: "https://raw.niuma666bet.buzz/Huibq/keep-alive/master/Music_Free/xiaowo.js",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "酷我APP：自建歌单-分享-复制试听链接，直接粘贴即可",
            "H5：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入时间和歌单大小有关，请耐心等待",
        ],
    },
    supportedSearchType: ["music", "album", "sheet", 'artist'],
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
    },
    getMediaSource,
    getMusicInfo,
    getAlbumInfo,
    getLyric,
    getArtistWorks,
    getTopLists,
    getTopListDetail,
    importMusicSheet,
    getRecommendSheetTags,
    getRecommendSheetsByTag,
    getMusicSheetInfo,
};
