// ============================================================
// 媒体文件旁路存储(IndexedDB)
// - 后台「上传文件」时,超过内嵌安全阈值的大文件(图片 >2MB、视频 >3MB)
//   不转 base64,而是原样暂存到浏览器 IndexedDB(容量远大于 localStorage 的约 5MB)
// - src 字段只保存相对路径字符串(如 assets/videos/xxx.mp4),localStorage 不受影响
// - 「导出数据」时从这里取出文件打包进 zip;发布流程会把素材落到项目 assets/ 随站点上线
// - 隐私模式 / 不支持 IndexedDB 时,接口 reject,调用方降级提示
// ============================================================
const DB_NAME = 'portfolio-media-store';
const DB_VERSION = 1;
const STORE = 'blobs';

let dbPromise = null;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE)) {
            req.result.createObjectStore(STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        // 打开失败时重置 dbPromise,下次调用重试(隐私模式恢复后无需刷新页面)
        req.onerror = () => {
          dbPromise = null;
          reject(req.error);
        };
        req.onblocked = () => {
          dbPromise = null;
          reject(new Error('IndexedDB 被其他页面占用,请关闭其他标签页后重试'));
        };
      } catch (e) {
        dbPromise = null;
        reject(e);
      }
    });
  }
  return dbPromise;
}

// 保存文件:key 使用最终相对路径(assets/videos/xxx.mp4),与 src 一一对应
export async function saveMediaBlob(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 读取文件,不存在时返回 null
export async function getMediaBlob(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// 删除文件(媒体被移除 / src 被改写时调用,尽力清理,失败可忽略)
export async function deleteMediaBlob(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    return undefined;
  }
}
