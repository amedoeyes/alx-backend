#!/usr/bin/env python3


"""LFU Caching"""


from base_caching import BaseCaching


class LFUCache(BaseCaching):
    """LFU cache class"""

    def __init__(self):
        """Init"""
        super().__init__()
        self.queue = []
        self.count = {}

    def put(self, key, item):
        """Add an item in the cache"""
        if key is None or item is None:
            return
        if key in self.cache_data:
            self.queue.remove(key)
            self.count[key] += 1
        elif len(self.cache_data) >= BaseCaching.MAX_ITEMS:
            discard = min(self.count, key=self.count.get)
            self.queue.remove(discard)
            del self.cache_data[discard]
            del self.count[discard]
            print("DISCARD: {}".format(discard))
        self.queue.append(key)
        self.count[key] = 1
        self.cache_data[key] = item

    def get(self, key):
        """Get an item by key"""
        if key in self.cache_data:
            self.queue.remove(key)
            self.queue.append(key)
            self.count[key] += 1
        return self.cache_data.get(key, None)
