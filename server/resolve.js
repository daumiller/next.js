import { join, sep, parse } from 'path'
import fs from 'mz/fs'
import glob from 'glob-promise'

export default async function resolve (id) {
  const paths = getPaths(id)
  for (const p of paths) {
    if (await isFile(p)) {
      return p
    }
  }

  const err = new Error(`Cannot find module ${id}`)
  err.code = 'ENOENT'
  throw err
}

export function resolveFromList (id, files) {
  const paths = getPaths(id)
  const set = new Set(files)
  for (const p of paths) {
    if (set.has(p)) return p
  }
}

//===== <AKTXYZ>
// 0 pad number to length 2
function pad2(n) {
  if (n <= 99) { n = ("0" + n).slice(-2); }
  return n;
}
//===== </AKTXYZ>

function getPaths (id) {
  const i = sep === '/' ? id : id.replace(/\//g, sep)

  if (i.slice(-3) === '.js') return [i]
  if (i.slice(-5) === '.json') return [i]

  //===== <AKTXYZ>
  // return possible file name list with 00-99 prefixes
  let list = [];
  if (i[i.length - 1] === sep) {
    list = [
      i + 'index.js',
      i + 'index.json'
    ]
  }
  else {
    let x = i.replace(/(.*\\)(.*)/, "$1@@$2.js");
    let l = [...Array(100).keys()].map((n) => { return x.replace("@@", pad2(n) + "_"); }).reverse();
    list = l.concat([
      i + '.js',
      join(i, 'index.js'),
      i + '.json',
      join(i, 'index.json')
    ]);
  }
  return list;
  //===== </AKTXYZ>

  if (i[i.length - 1] === sep) {
    return [
      i + 'index.js',
      i + 'index.json'
    ]
  }

  return [
    i + '.js',
    join(i, 'index.js'),
    i + '.json',
    join(i, 'index.json')
  ]
}

async function isFile (p) {
  let stat
  try {
    stat = await fs.stat(p)
  } catch (err) {
    if (err.code === 'ENOENT') return false
    throw err
  }

  // We need the path to be case sensitive
  const realpath = await getTrueFilePath(p)

  //===== <AKTXYZ>
  // rearrange to make easier to log out final result
  let ok = true;
  if (p !== realpath) ok = false;
  else ok = stat.isFile() || stat.isFIFO()
  //if (p.match(/SigninUserPass/) && p.match(/App.User/)) console.log("ISFILE3", ok ? "Y" : "N", p);
  return ok
  //===== </AKTXYZ>
}

// This is based on the stackoverflow answer: http://stackoverflow.com/a/33139702/457224
// We assume we'll get properly normalized path names as p
async function getTrueFilePath (p) {
  let fsPathNormalized = p
  // OSX: HFS+ stores filenames in NFD (decomposed normal form) Unicode format,
  // so we must ensure that the input path is in that format first.
  if (process.platform === 'darwin') fsPathNormalized = fsPathNormalized.normalize('NFD')

  // !! Windows: Curiously, the drive component mustn't be part of a glob,
  // !! otherwise glob.sync() will invariably match nothing.
  // !! Thus, we remove the drive component and instead pass it in as the 'cwd'
  // !! (working dir.) property below.
  var pathRoot = parse(fsPathNormalized).root
  var noDrivePath = fsPathNormalized.slice(Math.max(pathRoot.length - 1, 0))

  // Perform case-insensitive globbing (on Windows, relative to the drive /
  // network share) and return the 1st match, if any.
  // Fortunately, glob() with nocase case-corrects the input even if it is
  // a *literal* path.
  const result = await glob(noDrivePath, { nocase: true, cwd: pathRoot })
  return result[0]
}
