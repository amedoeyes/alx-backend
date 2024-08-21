#!/usr/bin/env python3


"""LIFO caching"""


from base_caching import BaseCaching


class LIFOCache(BaseCaching):
    """LIFO cache class"""

    def __init__(self):
        """Init"""
        super().__init__()
        self.stack = []

    def put(self, key, item):
        """Add an item in the cache"""
        if key is None or item is None:
            return
        if len(self.cache_data) >= BaseCaching.MAX_ITEMS:
            discard = self.stack.pop()
            del self.cache_data[discard]
            print("DISCARD: {}".format(discard))
        self.stack.append(key)
        self.cache_data[key] = item

    def get(self, key):
        """Get an item by key"""
        return self.cache_data.get(key, None)
