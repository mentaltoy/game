import fs from 'node:fs/promises';
import {createAscentGeometry,auditAscentGeometry} from './ascent-cycle.mjs';
import {getRoomStairs} from '../../dist/room-layout.js';
const metadata=JSON.parse(await fs.readFile(new URL('./measured-frames-candidate-01.json',import.meta.url),'utf8'));
const geometry=createAscentGeometry({nodes:getRoomStairs(),frames:metadata.frames});
const audit=auditAscentGeometry(geometry),limit=3.5;
const failures=[];
if(audit.maxContactErrorX>limit)failures.push(`Visible stance-point X error ${audit.maxContactErrorX.toFixed(2)}px exceeds ${limit}px.`);
if(audit.maxContactErrorY>limit)failures.push(`Visible stance-point Y error ${audit.maxContactErrorY.toFixed(2)}px exceeds ${limit}px.`);
failures.push('Ground entry, landing gather, stair reversal and descending cycle are not complete.');
const report={accepted:false,scope:'Ascent candidate 01 only; unchanged production V10 is outside this audit.',height:266,tolerance:limit,failures,audit};
await fs.writeFile(new URL('./acceptance-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({accepted:report.accepted,failures},null,2));
// Deliberately fail the acceptance gate. Passing geometry unit tests do not
// convert an unaccepted artwork sequence into a completed animation.
process.exitCode=1;
