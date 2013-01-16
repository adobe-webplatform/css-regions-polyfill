/*!
Copyright 2012 Adobe Systems Inc.;
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Various shims for missing functionality in older browsers
!function() {
    if (typeof String.prototype.trim !== "function") {
        
        String.prototype.trim = function(string) {
            return string.replace(/^\s+/,"").replace(/\s+$/,"");
        }
    }
    
    if (typeof Array.prototype.forEach !== 'function') {
        
        Array.prototype.forEach = function(iterator, thisArg) {
            if (typeof iterator !== 'function') {
                throw new TypeError("Invalid parameter. Expected 'function', got " + typeof iterator)
            }
            
            var self = Object(this),
                len = self.length,
                i = 0;
                
            for (i; i < len; i++) {
                // call the iterator function within the requested context with the current value, index and source array
                iterator.call(thisArg, this[i], i, self)
            }
        }
    }
    
    if (typeof Array.prototype.indexOf !== 'function') {
        
        Array.prototype.indexOf = function(value) {
            var self = Object(this),
                matchedIndex = -1;
            
            self.forEach(function(item, index) {
                if (item === value) {
                    matchedIndex = index
                    return
                }
            })
            
            return matchedIndex
        }
    }
}()