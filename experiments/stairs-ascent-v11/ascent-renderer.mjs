import {createAscentGeometry,ascentProgressFromPose} from './ascent-cycle.mjs';

/** Preview renderer only: unsupported entry/turn/gather returns false explicitly. */
export function createAscentRenderer({image,frames,nodes,referenceHeight=500,height=266,
  columns=4,cellWidth=500,cellHeight=620,gradeFrame=null}) {
  const geometry=createAscentGeometry({nodes,frames,height,referenceHeight});
  const painted=frames.map((frame,i)=>{
    const canvas=document.createElement('canvas');canvas.width=cellWidth;canvas.height=cellHeight;
    const context=canvas.getContext('2d');
    context.drawImage(image,(i%columns)*cellWidth,Math.floor(i/columns)*cellHeight,cellWidth,cellHeight,0,0,cellWidth,cellHeight);
    if(gradeFrame)gradeFrame(context,frame,i);
    return canvas;
  });
  function placement(pose) {
    const p=ascentProgressFromPose(pose);
    return p===null||p<geometry.first||p>geometry.last?null:geometry.placement(p);
  }
  return {
    source:{renderer:'whole-painted-ascent-preview',completeRoomFlow:false,referenceHeight},geometry,placement,
    getFootprints(pose) {
      const d=placement(pose);if(!d)return [];
      return Object.values(d.feet).filter(f=>f.target).map(f=>({x:f.x,y:f.target.y,
        clearance:Math.max(0,f.target.y-f.y),contact:Math.max(0,1-Math.abs(f.error.y)/7)}));
    },
    draw(ctx,pose,options={}) {
      const d=placement(pose);if(!d)return false;
      if(options.reflection||(options.alpha??1)<=0)return true;
      ctx.save();ctx.globalAlpha*=options.alpha??1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(painted[d.frameIndex],d.origin.x,d.origin.y,cellWidth*d.scale,cellHeight*d.scale);ctx.restore();
      return true;
    },
  };
}
