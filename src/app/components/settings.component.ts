import {Component, DestroyRef, effect, model, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {L10nPipe} from '../pipes/l10n.pipe';
import {Settings} from '../domains/settings.domain';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs';
import {faCog} from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  standalone: true,
  imports: [
    L10nPipe,
    FaIconComponent,
    ReactiveFormsModule,
  ],
  selector: '[appSettings]',
  template: `
    <form [formGroup]="form" class="contents">
      <button class="after:bg-stone-600/90 after:content-[''] after:absolute sm:after:h-12 after:left-0 md:after:h-12 sm:after:h-8 after:h-6
                     sm:-translate-y-[calc(100%+.75rem)] -translate-y-full origin-center left-full absolute top-1/2
                     bg-stone-600/90 aspect-square rounded-full md:h-12 sm:h-8 h-6
                     after:aspect-square after:animate-ping after:rounded-full
                     backdrop-blur-2xl cursor-pointer transition-all
                     place-items-center justify-center grid"
              (click)="languageRef.parentElement?.parentElement?.parentElement?.focus()"
      >
        <fa-icon class="border-t-transparent text-white/60 md:border-t-1 border-t-3 md:text-2xl text-sm"
                 [icon]="icons.faCog"></fa-icon>
      </button>
      <label>
        <input [placeholder]="settings()?.language"
               formControlName="language"
               list="languages"
               #languageRef
               type="text">
        <span>{{ 'settings.programming-language' | l10n }}</span>
        <datalist id="languages">
          @for (language of languages; track language) {
            <option [value]="language">{{ language }}</option>
          }
        </datalist>
      </label>

      <label>
        <input [placeholder]="settings()?.theme"
               formControlName="theme"
               list="themes"
               type="text">
        <span>{{ 'settings.theme' | l10n }}</span>
        <datalist id="themes">
          @for (theme of themes; track theme) {
            <option [value]="theme">{{ theme }}</option>
          }
        </datalist>
      </label>

      <label>
        <input formControlName="lineNumbersStart"
               type="number">
        <span>{{ 'settings.lineNumbersStart' | l10n }}</span>
      </label>

      <label>
        <input [placeholder]="'settings.lineNumbersStart.placeholder' | l10n"
               formControlName="lineHighlight"
               type="text">
        <span>{{ 'settings.lineHighlight' | l10n }}</span>
      </label>
    </form>
  `,
})
export class SettingsComponent implements OnInit {
  readonly settings = model<Settings>();

  protected readonly languages = 'abap,abnf,actionscript,ada,agda,al,antlr4,apacheconf,apex,apl,applescript,aql,arduino,arff,armasm,arturo,asciidoc,asm6502,asmatmel,aspnet,autohotkey,autoit,avisynth,avro-idl,awk,bash,basic,batch,bbcode,bbj,bicep,birb,bison,bnf,bqn,brainfuck,brightscript,bro,bsl,cfscript,chaiscript,cilkc,cilkcpp,cil,clike,clojure,cmake,c,cobol,coffeescript,concurnas,cooklang,coq,core,cpp,crystal,csharp,cshtml,csp,css-extras,css,csv,cue,cypher,dart,dataweave,dax,dhall,diff,django,d,dns-zone-file,docker,dot,ebnf,editorconfig,eiffel,ejs,elixir,elm,erb,erlang,etlua,excel-formula,factor,false,firestore-security-rules,flow,fortran,fsharp,ftl,gap,gcode,gdscript,gedcom,gettext,gherkin,git,glsl,gml,gn,go,go-module,gradle,graphql,groovy,haml,handlebars,haskell,haxe,hcl,hlsl,hoon,hpkp,hsts,http,ichigojam,icon,icu-message-format,idris,iecst,ignore,inform7,ini,io,javadoclike,javadoc,java,javascript,javastacktrace,jexl,j,jolie,jq,jsdoc,js-extras,json5,json,jsonp,jsstacktrace,js-templates,jsx,julia,keepalived,keyman,kotlin,kumir,kusto,latex,latte,less,lilypond,linker-script,liquid,lisp,livescript,llvm,log,lolcode,lua,magma,makefile,markdown,markup,markup-templating,mata,matlab,maxscript,mel,mermaid,metafont,mizar,mongodb,monkey,moonscript,n1ql,n4js,nand2tetris-hdl,naniscript,nasm,neon,nevod,nginx,nim,nix,nsis,objectivec,ocaml,odin,opencl,openqasm,oz,parigp,parser,pascaligo,pascal,pcaxis,peoplecode,perl,phpdoc,php-extras,php,plant-uml,plsql,powerquery,powershell,processing,prolog,promql,properties,protobuf,psl,pug,puppet,purebasic,pure,purescript,python,q,qml,qore,qsharp,racket,reason,regex,rego,renpy,rescript,rest,rip,r,roboconf,robotframework,ruby,rust,sas,sass,scala,scheme,scss,shell-session,smali,smalltalk,smarty,sml,solidity,solution-file,soy,sparql,splunk-spl,sqf,sql,squirrel,stan,stata,stylus,supercollider,swift,systemd,t4-cs,t4-templating,t4-vb,tap,tcl,textile,toml,tremor,tsx,tt2,turtle,twig,typescript,typoscript,unrealscript,uorazor,uri,vala,vbnet,velocity,verilog,vhdl,vim,visual-basic,v,warpscript,wasm,web-idl,wgsl,wiki,wolfram,wren,xeora,xml-doc,xojo,xquery,yaml,yang,zig'.split(',');
  protected readonly themes = 'coy,dark,funky,okaidia,solarizedlight,tomorrow,twilight'.split(',');
  protected form!: FormGroup<{
    lineNumbersStart: FormControl<number | null>;
    lineHighlight: FormControl<string | null>;
    language: FormControl<string | null>;
    theme: FormControl<string | null>;
  }>;
  protected readonly icons = {
    faCog,
  } as const;

  readonly #LINE_HIGHLIGHT_REGEX = /^(\s*[1-9]\d*\s*(-\s*[1-9]\d*\s*)?)(,\s*[1-9]\d*\s*(-\s*[1-9]\d*\s*)?)*$/;

  constructor(private readonly fb: FormBuilder,
              private readonly destroyRef: DestroyRef) {
    effect(() => {
      if (this.#sortedJson(this.settings()) !== this.#sortedJson(this.form.value)) {
        this.form.setValue({...this.form.value, ...this.settings() as Required<Settings> ?? {}});
      }
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      theme: this.fb.control('', [
        ({value: _}) => !_ || this.themes.includes(_) ? null : {invalid: true},
      ]),
      language: this.fb.control('javascript', [
        Validators.required,
        ({value: _}) => !_ || this.languages.includes(_) ? null : {invalid: true},
      ]),
      lineHighlight: this.fb.control<string | null>(null, [
        ({value: _}) => !_ || this.#LINE_HIGHLIGHT_REGEX.test(_) ? null : {invalid: true},
      ]),
      lineNumbersStart: this.fb.control<number | null>(null, [
        ({value: _}) => !_ || /^-?(0|[1-9]\d*)$/.test(`${_ ?? ''}`) ? null : {invalid: true},
      ]),
    });
    this.form.valueChanges
      .pipe(filter(() => this.form.valid))
      .pipe(filter(_ => this.#sortedJson(_) !== this.#sortedJson(this.settings())))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.settings.set(value));
  }

  #sortedJson(value: object = {}) {
    return JSON.stringify(value, Object.keys(value).sort());
  }
}
