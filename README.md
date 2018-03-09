# FlexiCache

### Lightweight auto-balancing cache handler with zero dependencies.

FlexiCache automatically balance caches by expiration time, frequency of data accesses, access timeout, maximum stack size and/or memory limit. 

Supported Platforms:
- Browser
- Node.js

Supported Module Definitions:
- AMD (RequireJS, Xone)
- CommonJS (Node.js)
- Closure (Xone)
- Global (window)

All Features:
<ul>
    <li>Auto-cleanup cache by:<ul>
        <li>Expiration time</li>
        <li>Frequency of data accesses</li>
        <li>Access timeout</li>
        <li>Maximum size (stack)</li>
        <li>Memory limit</li>
    </ul></li>
    <li>Allows free combination of all the above options</li>
    <li>Debug infos & statistics</li>
    <li>Save / Load dump</li>
</ul>

Optional Plugins: (actually unreleased)
<ul>
    <li>Redis API Adapter</li>
    <li>Filesystem Plugin (HTML5)</li>
    <li>Filesystem Plugin (Node.js)</li>
    <li>LocalStorage Plugin (HTML5)</li>
</ul>

## Installation

##### HTML / Javascript

```html
<html>
<head>
    <script src="https://cdn.rawgit.com/nextapps-de/flexicache/master/flexicache.min.js"></script>
</head>
...
```

##### Node.js

```npm
npm install flexicache
```

In your code include as follows:

```javascript
var FlexiCache = require("flexicache");
```

Or pass in options when requiring:

```javascript
var cache = require("flexicache").create({/* options */});
```

__AMD__

```javascript
var FlexiCache = require("./flexicache.js");
```

## Usage (API)

#### Create a new cache

```js
var cache = new FlexiCache();
```

alternatively you can also use:

```js
var cache = FlexiCache.create();
```

##### Create a new cache with custom options

> FlexiCache.__create__(options)

```js
var cache = new FlexiCache({

    // default values:

    expire: 60 * 60 * 1000, // 1 hour
    size: 1000,
    auto: true,
    timeout: false,
    memory: false
});
```

#### Add items to a cache

> Cache.__add___(id, *)

```js
cache.add(10000, 'foo');
```
add more complex objects:
```js
cache.add(10025, {
    
    id: 10025,
    name: 'foo'
});
```
clone and add objects:
```js
cache.add(10025, {
    
    id: 10025,
    name: 'foo'
    
}, true);
```

#### Update item of the cache

> Cache.__update__(id, *)

```js
cache.update(10000, 'bar');
```
clone and update objects:
```js
cache.update(10025, {
    
    id: 10025,
    name: 'foo'
    
}, true);
```

#### Remove item to the cache

> Cache.__remove__(id)

```js
cache.remove(10025);
```

#### Destroy the cache

```js
cache.destroy();
```

#### Initialize the cache

> Cache.__init__(options)

```js
cache.init();
```

#### Get info

```js
cache.info();
```

Returns information about the cache, e.g.:

```json
{
    "bytes": 3600356288,
    "id": 0,
    "auto": false,
    "expire": 3600,
    "size": 10000,
    "status": false
}
```

#### Optimize / Cleanup cache

```js
cache.cleanup();
```

---
Author FlexiCache: Thomas Wilkerling<br>
License: <a href="http://www.apache.org/licenses/LICENSE-2.0.html" target="_blank">Apache 2.0 License</a><br>
