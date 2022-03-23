# Features
Scrapes scenes from https://vrhush.com and generates a content bundle for XBVR (https://github.com/xbapps/xbvr)

# Requirements
- nodejs >= 16.14.2
- yarn >= 3.2.0

# Setup
Clone this repository and run ***yarn install***

# Usage
1. run ***yarn run scrape*** which will generate scene files in the **.cache** directory
2. run ***yarn run bundle*** which will generate a bundle file in the **bundles** directory
3. upload that bundle anywhere on the web and import it to XBVR
