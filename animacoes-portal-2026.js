/* FAAAB: movimento leve, sem autoplay ou efeitos cintilantes. */
(()=>{
 "use strict";
 const nav=document.querySelector(".primary-nav");
 const update=()=>nav?.classList.toggle("is-scrolled",scrollY>24);
 update();addEventListener("scroll",update,{passive:true});
 if(matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window))return;
 const visible=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add("militar-visible");visible.unobserve(e.target)}
 }),{threshold:0.06,rootMargin:"0px 0px 25px 0px"});
 const selector=".section-cap,.institution,.after-card,.sidebar-box,.side-story";
 const seen=new WeakSet();
 const register=node=>{
  if(node.nodeType!==1)return;
  const nodes=[];
  if(node.matches?.(selector))nodes.push(node);
  node.querySelectorAll?.(selector).forEach(el=>nodes.push(el));
  nodes.forEach(el=>{if(seen.has(el))return;seen.add(el);el.classList.add("militar-reveal");visible.observe(el)});
 };
 document.documentElement.classList.add("militar-motion");
 register(document.body);
 const root=document.querySelector("main");
 if(root){
  const changes=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(register)));
  changes.observe(root,{childList:true,subtree:true});
 }
})();
