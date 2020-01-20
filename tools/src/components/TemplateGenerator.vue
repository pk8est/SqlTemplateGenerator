<template>
  <div class="template-generator">
      <Row>
        <Col span="4">
            <Row>
                <Col span="8"><!-- <Button v-on:click="clearHandle" long>清空内容</Button> --></Col>
                <Col span="16">
                  <Select v-model="paramType" @on-change="changeHandle">
                      <Option v-for="item in paramTypes" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </Col>
            </Row>
        </Col>
        <Col span="10">
            <Button type="success" v-on:click="clickHandle" long>生成</Button>
        </Col>
        <Col span="10">
            <Button type="warning" v-on:click="copyHandle" long>复制</Button>
        </Col>
    </Row>
    <Row>
        <Col span="4">
            <!-- <Input v-model="param" type="textarea" :autosize="{minRows: 40, maxRows: 40}" placeholder="请输入数组,换行或者逗号分隔"></Input> -->
            <codemirror v-model="param" class="param-mirror" :options="Object.assign({}, cmOptions, paramOptions)" @cursorActivity="onCursorActivity"></codemirror>
        </Col>
        <Col span="10">
          <codemirror v-model="template" class="code-mirror" :options="Object.assign({}, cmOptions, codeOptions)" @cursorActivity="onCursorActivity"></codemirror>
          <!--  <Input  ref="code" v-model="template" type="textarea" :autosize="{minRows: 40, maxRows: 40}" placeholder="请输入模板"></Input> -->
        </Col>
        <Col span="10">
          <!-- <Input v-model="message" class="message-input" disabled type="textarea" :autosize="{minRows: 44, maxRows: 44}" placeholder=""></Input> -->
          <codemirror :value="message" class="code-mirror" :options="Object.assign({}, cmOptions, codeOptions)" ></codemirror>
        </Col>
    </Row>
  </div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/theme/blackboard.css';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/lib/codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/hint/anyword-hint';

import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';

import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/mode/javascript/javascript';



const spliter = (content, lineSeparator = '', rowSeparator = '')  => content.split(lineSeparator).map(item => item.split(rowSeparator))

const reverse = (condition, return1, return2) => condition ? return1 : return2

const range = function * (start, end, step = 1) {
    for (let i = start; reverse(step > 0, i < end, i > end); i += step)
        yield [i]
}

//for (const i of range(0, 10, 1))  console.log(i)

const rangeSplier = function(start, end, step = 1, contain = false) {
    let data = []
    let current;
    if(step != 0){
        while(reverse(step > 0, start < end, start > end)){
            current = start + step
            current = reverse(reverse(step > 0, current < end, current > end), current, end)
            data.push([start, current])
            start = contain ? current : current + reverse(step > 0, step / step, -step / step)
        }
    }
    return data
}

//console.info(rangeSplier(0, 100, 20, false))

const timeSplier = function(start, end, step, stepUtil = 'hours', format = 'YYYY-MM-DD HH:mm:ss', contain = true) {
    let data = []
    if(step != 0){
        let startTime = moment(start, format)
        let current = moment(start, format)
        let endTime = moment(end, format)
        while(reverse(step > 0, startTime < endTime, startTime > endTime)){
            current.add(step, stepUtil)
            current = reverse(reverse(step > 0, current < endTime, current > endTime), current, endTime)
            data.push([startTime.format(format), current.format(format)])
            startTime = moment(contain ? current : current.add(reverse(step > 0, step / step, -step / step), stepUtil))
        }
    }
    return data
}

export default {
  name: 'TemplateGenerator',
  components: { codemirror },
  data () {
      return {
        param: '',
        paramType: 'auto_split_by_comma',
        autoFill: false,
        paramTypes: [
            {
                value: 'auto_split_by_comma',
                label: '自动分隔行列(","号分隔)',
                line_separator: "\n",
                row_separator: ",",
                template: "",
                handle: spliter
            },
            {
                value: 'auto_split_by_tick',
                label: '自动分隔行列("|"号分隔)',
                line_separator: "\n",
                row_separator: "|",
                template: "",
                handle: spliter
            },
            {
                value: 'range',
                label: 'for循环',
                line_separator: "",
                row_separator: "",
                template: "let start = 0\nlet end = 10\nlet step = 1",
                handle: function(content) {
                    let data = new Function(content + "; return [start,end,step]")()
                    return range(...data)
                }
            },
            {
                value: 'number_interval',
                label: '自动生成数字区间',
                line_separator: "",
                row_separator: "",
                template: `let start = 0\nlet end = 100\nlet step = 20\nlet contain = false`,
                handle: function(content) {
                    let data = new Function(content + "; return [start,end,step]")()
                    return rangeSplier(...data)
                }
            },
            {
                value: 'time_interval',
                label: '自动生成时间区间',
                line_separator: "",
                row_separator: ",",
                template: "let start = '2020-01-01 00:00:00'\nlet end = '2020-01-02 00:00:00'\nlet step = 12\nlet util = 'hours'\nlet format='YYYY-MM-DD HH:mm:ss'\nlet contain = true",
                handle: function(content) {
                    let data = new Function(content + "; return [start,end,step,util,format,contain]")()
                    return timeSplier(...data)
                }
            },
            {
                value: 'custom',
                label: '自定义',
                line_separator: "",
                row_separator: "",
                template: "let data=[{\n\tid: 1, \n\tname: '小明'\n}]\n\nreturn data",
                handle: function(content){
                    let data = new Function(content)()
                    if(!(data instanceof Array)){
                        data = [data]
                    }
                    return data
                }
            },
        ],
        cmOptions: {
          line: true,
          tabSize: 4,
          lineNumbers: true,     // 显示行号
          indentUnit: 4,         // 缩进单位为4
          styleActiveLine: true, // 当前行背景高亮
          matchBrackets: true,   // 括号匹配
          mode: 'htmlmixed',     // HMTL混合模式
          lineWrapping: true,    // 自动换行
          theme: 'blackboard',      // 编辑器主题
          extraKeys: {'Ctrl': 'autocomplete'},   //自动提示配置
          indentWithTabs: true,
          smartIndent: true,
          lineNumbers: true,
          matchBrackets: true
        },
        paramOptions: {
          mode: {name: 'javascript'}   
        },
        codeOptions: {
          mode: {name: 'text/x-mariadb'},   
          hintOptions: {
            // 自定义提示选项
            tables: {
              users: ['name', 'score', 'birthDate'],
              countries: ['name', 'population', 'size']
            }
          }
        },
        template: '',
        message: ''
      }
  },
  mounted () {
   
  },
  methods: {
      clickHandle: function(){
          let outputs = []
          let fn = this.build(this.template.trim())
          try{
              let counter = 0
              console.info("[PARAM]")
              console.table(this.param)
              console.info("[TEMPLATE]")
              console.table(this.template)
              let paramType = this.getSelectedParamType(this.paramType)
              let list = paramType.handle.call(paramType, this.param, paramType.line_separator, paramType.row_separator)
              for(let param of list){
                  console.debug(counter, param)
                  outputs.push(fn(counter++, param))
              }
              console.debug(fn)
          }catch(error){
              this.$Message.error(error.message, 10000)
              console.error(error)
          }
          
          this.message = outputs.join("\n")
      },
      changeHandle: function(){
          this.autoFill = true
          this.param = this.getSelectedParamType(this.paramType).template.trim()
      },
      clearHandle: function(){
        this.param = ''
      },
      getSelectedParamType: function(type){
        this.paramTypes.forEach((index) => console.info())
          for(let paramType of this.paramTypes){
              if(paramType.value == type){
                 return paramType
              }
          }
          return this.paramTypes[0]
      },
      copyHandle: function(){
          this.$copyText(this.message)
          this.$Message.success('复制成功')
      },
      onCursorActivity: function(codemirror){
        //console.info(codemirror.getValue())
        if(this.autoFill == false && codemirror.getValue() != ''){
          codemirror.showHint({completeSingle: false})
        }
        if(this.autoFill == true){
          this.autoFill = false;
        }
      },
      build: function (template) {
          return new Function("index", "...__param__", `
              let param; 
              if(__param__ instanceof Array){
                  param = __param__[0]
              }; 
              return \`` + template
                  .replace(/`/g,'\\`') 
                  .replace(/\$\{?([a-zA-Z\d_]*)\}?/g,"${param['$1']}") 
              + "`")
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

</style>

<style>
.message-input textarea[disabled] {
  color: #F8F8F8;
  background-color: #0C1021;
}

.CodeMirror {
 /* Set height, width, borders, and global font properties here */
    font-family: monospace;
    height: 933px;
    font-size: 14px;
    font-family:"微软雅黑"
}

.param-mirror, .code-mirror {
  border-right: 1px solid #fff;
}
</style>
