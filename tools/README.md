# TemplateGenerator

> 一个快速生成模板的工具

## Dev Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev
```

## Run Build
``` bash
# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# 
npm install -g serve

# local run server
serve -s dist
```


## Deploy Build
``` bash
docker build . -t template-generator

docker run -d --restart=always -p 8080:80 template-generator

curl localhost:8080
```
