-- Existing Feature-Lab items receive a cached browser-rendered preview URL.
update public.feature_lab_items
set screenshot_url = 'https://image.thum.io/get/width/800/crop/900/maxAge/24/noanimate/?url=' || replace(reference_url, ' ', '%20')
where screenshot_url is null or screenshot_url = '';
