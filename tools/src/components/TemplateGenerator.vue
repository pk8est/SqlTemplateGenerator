<template>
  <div class="template-generator">
      <Row>
        <Col span="4">
            <!-- <Row>
                <Col span="8"><Button v-on:click="clearHandle" long>清空内容</Button></Col>
                <Col span="16">
                  <Select v-model="codeType" @on-change="changeHandle">
                      <Option v-for="item in codeTypes" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </Col>
            </Row> -->
            <Select v-model="codeType" @on-change="changeHandle">
              <Option v-for="item in codeTypes" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
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
            <!-- <Input v-model="code" type="textarea" :autosize="{minRows: 40, maxRows: 40}" placeholder="请输入数组,换行或者逗号分隔"></Input> -->
            <codemirror v-model="code" class="code-mirror" :options="Object.assign({}, cmOptions, codeOptions)" @cursorActivity="onCursorActivity" @beforeChange="onBeforeChange"></codemirror>
        </Col>
        <Col span="10">
          <codemirror v-model="template" class="code-mirror" :options="Object.assign({}, cmOptions, templateOptions)" @cursorActivity="onCursorActivity($event)" @beforeChange="onBeforeChange"></codemirror>
          <!--  <Input  ref="code" v-model="template" type="textarea" :autosize="{minRows: 40, maxRows: 40}" placeholder="请输入模板"></Input> -->
        </Col>
        <Col span="10">
          <!-- <Input v-model="message" class="message-input" disabled type="textarea" :autosize="{minRows: 44, maxRows: 44}" placeholder=""></Input> -->
          <codemirror :value="message" class="code-mirror" :options="Object.assign({}, cmOptions, messageOptions)" ></codemirror>
        </Col>
    </Row>
  </div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'
import { codemirror } from 'vue-codemirror'

import 'codemirror/lib/codemirror'
import 'codemirror/lib/codemirror.css'

// language
import 'codemirror/mode/sql/sql.js'
import 'codemirror/mode/javascript/javascript.js'

// theme css
import 'codemirror/theme/monokai.css'
//import 'codemirror/theme/blackboard.css';

// require active-line.js
import'codemirror/addon/selection/active-line.js'

// styleSelectedText
import'codemirror/addon/selection/mark-selection.js'
import'codemirror/addon/search/searchcursor.js'

// hint
import'codemirror/addon/hint/show-hint.js'
import'codemirror/addon/hint/show-hint.css'
import'codemirror/addon/hint/sql-hint.js'
import'codemirror/addon/hint/javascript-hint.js'
import'codemirror/addon/selection/active-line.js'

// highlightSelectionMatches
import'codemirror/addon/scroll/annotatescrollbar.js'
import'codemirror/addon/search/matchesonscrollbar.js'
import'codemirror/addon/search/searchcursor.js'
import'codemirror/addon/search/match-highlighter.js'

// keyMap
import'codemirror/mode/clike/clike.js'
import'codemirror/addon/edit/matchbrackets.js'
import'codemirror/addon/comment/comment.js'
import'codemirror/addon/dialog/dialog.js'
import'codemirror/addon/dialog/dialog.css'
import'codemirror/addon/search/searchcursor.js'
import'codemirror/addon/search/search.js'
import'codemirror/keymap/sublime.js'

// foldGutter
import'codemirror/addon/fold/foldgutter.css'
import'codemirror/addon/fold/brace-fold.js'
import'codemirror/addon/fold/comment-fold.js'
import'codemirror/addon/fold/foldcode.js'
import'codemirror/addon/fold/foldgutter.js'
import'codemirror/addon/fold/indent-fold.js'
import'codemirror/addon/fold/markdown-fold.js'
import'codemirror/addon/fold/xml-fold.js'

let printer = null;

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
        code: '',
        codeType: 'time_interval',
        changedEvent: null,
        codeTypes: [
            {
                value: 'auto_split_by_comma',
                label: '自动分隔行列(","号分隔)',
                template: "",
                handle: content => spliter(content, "\n", ',')
            },
            {
                value: 'auto_split_by_tick',
                label: '自动分隔行列("|"号分隔)',
                template: "",
                handle: content => spliter(content, "\n", '|')
            },
            {
                value: 'range',
                label: 'for循环',
                template: "let start = 0\nlet end = 10\nlet step = 1",
                handle: function(content) {
                    let data = new Function(content + "; return [start,end,step]")()
                    return range(...data)
                }
            },
            {
                value: 'number_interval',
                label: '自动生成数字区间',
                template: `let start = 0\nlet end = 100\nlet step = 20\nlet contain = false`,
                handle: function(content) {
                    let data = new Function(content + "; return [start,end,step]")()
                    return rangeSplier(...data)
                }
            },
            {
                value: 'time_interval',
                label: '自动生成时间区间',
                template: "let start = '2020-01-01 00:00:00'\nlet end = '2020-01-02 00:00:00'\nlet step = 12\nlet util = 'hours'\nlet format='YYYY-MM-DD HH:mm:ss'\nlet contain = true",
                handle: function(content) {
                    let data = new Function(content + "; return [start,end,step,util,format,contain]")()
                    return timeSplier(...data)
                }
            },
            {
                value: 'custom',
                label: '自定义',
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
          theme: 'monokai',      // 编辑器主题
          extraKeys: {'Ctrl': 'autocomplete'},   //自动提示配置
          styleSelectedText: true,
          indentWithTabs: true,
          smartIndent: true,
          lineNumbers: true,
          lineWrapping: true,
          matchBrackets: true,
          foldGutter: true,
          keyMap: "sublime",
          matchBrackets: true,
          gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
          showCursorWhenSelecting: true, //在选择时是否显示光标，默认为false
          lineWiseCopyCut: true,         //启用时，如果在复制或剪切时没有选择文本，那么就会自动操作光标所在的整行
          undoDepth: 1000,               //最大撤消次数，默认为200（包括选中内容改变事件）
          //historyEventDelay: 500       //在输入或删除时引发历史事件前的毫秒数。
          hintOptions:{
            completeSingle: false
          }
        },
        codeOptions: {
          mode: {name: 'javascript'}   
        },
        templateOptions: {
          mode: {name: 'text/x-mariadb'},   
          hintOptions: {
            // 自定义提示选项
            tables: {
              //users: ['name', 'score', 'birthDate'],
              //countries: ['name', 'population', 'size']
            }
          }
        },
        messageOptions: {
          mode: {name: 'text/x-mariadb'},
          readOnly: true
        },
        template: '',
        message: ''
      }
  },
  mounted () {
    let codeType = this.getSelectedCodeType(this.codeType)
    if(codeType != undefined && codeType.template != ''){
      this.code = codeType.template
    }
  },
  methods: {
      clickHandle: function(){
          
          let outputs = []
          let current = moment().format('YYYY-MM-DD HH:mm:ss') + ' 开始, 耗时'
          console.time(current)

          let fn = this.build(this.template.trim())
          try{
              let counter = 1
              console.debug("[CODE]")
              console.debug(this.code)
              console.debug("[TEMPLATE]")
              console.debug(this.template)
              let codeType = this.getSelectedCodeType(this.codeType)
              let list = codeType.handle.call(codeType, this.code)
              console.table(list)
              for(let param of list){
                  outputs.push(fn(counter++, param))
              }
              this.message = outputs.join("\n")
              this.$Message.success('生成成功')
              //console.debug(fn)
          }catch(error){
              this.message = error.stack
              this.$Message.error(error.toString(), 10)
              console.error(error)
          }
          console.timeEnd(current);          
      },
      changeHandle: function(){
          this.code = this.getSelectedCodeType(this.codeType).template.trim()
      },
      clearHandle: function(){
        this.code = ''
      },
      getSelectedCodeType: function(type){
        this.codeTypes.forEach((index) => console.info())
          for(let codeType of this.codeTypes){
              if(codeType.value == type){
                 return codeType
              }
          }
          return this.codeTypes[0]
      },
      copyHandle: function(){
          this.$copyText(this.message)
          this.$Message.success('复制成功')
      },
      charCodeAt: function(str){
        return str.charCodeAt(0)
      },
      isShowHintChar: function(str){
        let code =  this.charCodeAt(str)
        if(
          (code >= 97 && code <= 122)     //a-z
          || (code >= 65 && code <= 90)   //A-Z
          || (code >= 45 && code <= 47)   //0-9
          || code == 95                   //_
        ) {
          return true
        }
        return false
      },
      onCursorActivity: function(codemirror, e){
        if(this.changedEvent == null) return
        if(['paste', 'setValue', 'complete'].indexOf(this.changedEvent.origin) !== -1 ) return
        if(this.changedEvent.origin === '+input' && !this.isShowHintChar(this.changedEvent.text[this.changedEvent.text.length - 1])) return
        if(this.changedEvent.origin === '+delete') {
          let line = codemirror.getLineHandle(this.changedEvent.from.line)
          if(line === undefined) return
          let beforeWord = line.text[this.changedEvent.from.ch - 1]
          if(beforeWord === undefined || !this.isShowHintChar(beforeWord[beforeWord.length - 1])){
            return
          }
        }
        
        codemirror.showHint({completeSingle: false})
        this.changedEvent = null
      },
      onBeforeChange: function(codemirror, event){
        this.changedEvent = event
      },
      build: function (template) {
        let code = `
            let param = []; 
            if(__param__ instanceof Array){
                param = __param__[0]
            }; 
            if(param['index'] === undefined){
              param['index'] = index
            }

            return \`` + template
                .replace(/`/g,'\\`') 
                .replace(/\$([a-zA-Z\d_]+)/g,"${param['$1']}") 
            + "`";

        return new Function("index", "...__param__", code)
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<style>
.message-input textarea[disabled] {
  color: #F8F8F8;
  background-color: #0C1021;
}

.template-generator .CodeMirror {
 /* Set height, width, borders, and global font properties here */
    font-family: monospace;
    height: 933px;
    font-size: 14px;
    font-family:"微软雅黑"
}

.template-generator .code-mirror, .code-mirror {
  border-right: 1px solid #fff;
}
</style>
