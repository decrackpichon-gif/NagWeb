/* NagWeb Interaction Target Registry v1
   Optional DOM adapter for dynamic reactive target membership.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_TARGET_REGISTRY=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var VERSION='1.1.0';
  function uniqueElements(list){
    return Array.from(new Set((Array.isArray(list)?list:Array.from(list||[])).filter(Boolean)));
  }
  function diffElements(previous,next){
    previous=uniqueElements(previous);next=uniqueElements(next);
    return {
      added:next.filter(function(el){return previous.indexOf(el)<0;}),
      removed:previous.filter(function(el){return next.indexOf(el)<0;}),
      retained:next.filter(function(el){return previous.indexOf(el)>=0;})
    };
  }
  function duplicateIds(elements,attribute){
    attribute=attribute||'data-nw-target-id';
    var seen=new Map(),dupes=[];
    uniqueElements(elements).forEach(function(el){
      if(!el||typeof el.getAttribute!=='function')return;
      var id=el.getAttribute(attribute);if(!id)return;
      if(seen.has(id)&&dupes.indexOf(id)<0)dupes.push(id);else seen.set(id,el);
    });
    return dupes;
  }
  function createRegistry(input){
    if(typeof document==='undefined')throw new Error('NagWeb Target Registry: browser environment required');
    input=input||{};
    var root=input.root||document;
    if(!root||typeof root.querySelectorAll!=='function')throw new Error('NagWeb Target Registry: root is required');
    var selector=input.selector||'[data-nw-target-id]';
    var activeAttribute=input.activeAttribute||'data-nw-reactive';
    var includeInactive=input.includeInactive===true;
    var activeValue=input.activeValue==null?'1':String(input.activeValue);
    var listeners=new Set(),elements=[],revision=0,destroyed=false,pending=false,pendingReason=null,observer=null,fieldBindings=new Set();

    function collect(){
      var list=Array.from(root.querySelectorAll(selector));
      if(!includeInactive)list=list.filter(function(el){return el.getAttribute(activeAttribute)===activeValue;});
      return uniqueElements(list);
    }
    function snapshot(diff,reason){
      return {
        version:VERSION,
        revision:revision,
        reason:reason||'refresh',
        elements:elements.slice(),
        ids:elements.map(function(el){return el.getAttribute&&el.getAttribute('data-nw-target-id')||null;}),
        added:(diff&&diff.added||[]).slice(),
        removed:(diff&&diff.removed||[]).slice(),
        retained:(diff&&diff.retained||[]).slice(),
        duplicates:duplicateIds(elements,'data-nw-target-id'),
        membershipChanged:!!(diff&&((diff.added&&diff.added.length)||(diff.removed&&diff.removed.length))),
        configChanged:reason==='attributes'
      };
    }
    function refresh(reason){
      if(destroyed)return snapshot(null,'destroyed');
      var next=collect(),diff=diffElements(elements,next);
      var changed=diff.added.length||diff.removed.length;
      var shouldNotify=!!changed||reason==='manual'||reason==='attributes'||reason==='mutation';
      elements=next;
      if(shouldNotify)revision++;
      var state=snapshot(diff,reason||'refresh');
      if(shouldNotify)listeners.forEach(function(fn){fn(state);});
      return state;
    }
    function schedule(reason){
      if(destroyed)return;
      if(reason==='mutation'||!pendingReason)pendingReason=reason||'mutation';
      if(pending)return;
      pending=true;
      Promise.resolve().then(function(){
        var nextReason=pendingReason||'mutation';pending=false;pendingReason=null;refresh(nextReason);
      });
    }
    function subscribe(fn,options){
      if(typeof fn!=='function')return function(){};
      listeners.add(fn);
      if(options&&options.immediate)fn(snapshot({added:elements,removed:[],retained:[]},'subscribe'));
      return function(){listeners.delete(fn);};
    }
    function bindField(field){
      if(!field||typeof field.setTargets!=='function')throw new Error('NagWeb Target Registry: field.setTargets() is required');
      field.setTargets(elements);
      var unsub=subscribe(function(state){
        field.setTargets(state.elements);
        if(typeof field.syncTargets==='function')field.syncTargets();
      });
      var binding=function(){unsub();fieldBindings.delete(binding);};
      fieldBindings.add(binding);return binding;
    }
    elements=collect();
    if(typeof MutationObserver==='function'){
      observer=new MutationObserver(function(records){
        var structural=records.some(function(m){return m.type==='childList'||(m.type==='attributes'&&(m.attributeName==='data-nw-target-id'||m.attributeName===activeAttribute));});
        schedule(structural?'mutation':'attributes');
      });
      observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:[
        'data-nw-target-id',activeAttribute,'data-nw-influence-weight','data-nw-influence-move','data-nw-influence-rotate',
        'data-nw-influence-scale','data-nw-influence-return','data-nw-reaction-profile'
      ]});
    }
    return {
      version:VERSION,
      get revision(){return revision;},
      get elements(){return elements.slice();},
      get ids(){return snapshot().ids;},
      get duplicates(){return duplicateIds(elements,'data-nw-target-id');},
      refresh:function(){return refresh('manual');},
      subscribe:subscribe,
      bindField:bindField,
      destroy:function(){
        if(destroyed)return;destroyed=true;if(observer)observer.disconnect();
        Array.from(fieldBindings).forEach(function(unbind){unbind();});
        listeners.clear();elements=[];
      }
    };
  }
  return {version:VERSION,uniqueElements:uniqueElements,diffElements:diffElements,duplicateIds:duplicateIds,createRegistry:createRegistry};
});
