package vn.edu.iuh.fit.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

@Component
public class CacheCleaner implements ApplicationRunner {

    @Autowired
    private CacheManager cacheManager;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        cacheManager.getCacheNames().forEach(name -> {
            Cache cache = cacheManager.getCache(name);
            if (cache != null) {
                System.out.println("🧹 Clearing cache: " + name);
                cache.clear();
            }
        });
    }
}