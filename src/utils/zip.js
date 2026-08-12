// ============================================================
// 极简 ZIP 打包(store 无压缩模式,零第三方依赖)
// 用途:「导出数据」时把 JSON 与暂存在 IndexedDB 的大文件一起打包下载,
// 本地同步脚本解压后素材自动落到项目 assets/ 目录
// 仅实现存储(不压缩),兼容 Windows 资源管理器 / Expand-Archive 解压
// ============================================================

// CRC32(标准 zip 校验算法)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// DOS 格式时间戳(本地时区,用于 zip 文件头)
function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

// 打包文件列表为 zip Blob
// files: [{ name: 'portfolio-data.json', blob: Blob }, { name: 'assets/videos/x.mp4', blob: Blob }, ...]
export async function makeZip(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const { time, day } = dosDateTime(new Date());

  for (const f of files) {
    const buf = new Uint8Array(await f.blob.arrayBuffer());
    const nameBytes = encoder.encode(f.name);
    const crc = crc32(buf);
    const size = buf.length;
    const flags = 0x0800; // 文件名 UTF-8

    // 本地文件头(30 字节)
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // 需要的最低版本
    local.setUint16(6, flags, true);
    local.setUint16(8, 0, true); // 压缩方式:store
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true); // 压缩后大小 = 原大小
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true); // extra 长度

    parts.push(local.buffer, nameBytes, buf);
    central.push({ nameBytes, crc, size, offset });
    offset += 30 + nameBytes.length + size;
  }

  // 中央目录
  const cdStart = offset;
  for (const c of central) {
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true); // 创建者版本
    cd.setUint16(6, 20, true); // 需要的最低版本
    cd.setUint16(8, 0x0800, true); // flags
    cd.setUint16(10, 0, true); // store
    cd.setUint16(12, time, true);
    cd.setUint16(14, day, true);
    cd.setUint32(16, c.crc, true);
    cd.setUint32(20, c.size, true);
    cd.setUint32(24, c.size, true);
    cd.setUint16(28, c.nameBytes.length, true);
    cd.setUint16(30, 0, true); // extra
    cd.setUint16(32, 0, true); // comment
    cd.setUint16(34, 0, true); // 起始磁盘
    cd.setUint16(36, 0, true); // 内部属性
    cd.setUint32(38, 0, true); // 外部属性
    cd.setUint32(42, c.offset, true); // 本地头偏移
    parts.push(cd.buffer, c.nameBytes);
    offset += 46 + c.nameBytes.length;
  }

  // 中央目录结束记录(EOCD)
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, central.length, true);
  eocd.setUint16(10, central.length, true);
  eocd.setUint32(12, offset - cdStart, true);
  eocd.setUint32(16, cdStart, true);
  eocd.setUint16(20, 0, true); // comment 长度
  parts.push(eocd.buffer);

  return new Blob(parts, { type: 'application/zip' });
}
