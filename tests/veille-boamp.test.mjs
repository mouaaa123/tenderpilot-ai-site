import test from 'node:test';
import assert from 'node:assert/strict';
import {getOffers} from '../docs/veille-boamp.mjs';

const future = new Date(Date.now() + 3 * 86400000).toISOString();
const expired = new Date(Date.now() - 86400000).toISOString();
function notice(id, overrides = {}) {
  return {idweb:id, objet:'Entretien des chaufferies', code_departement:['57'],
    dateparution:'2026-01-01', datelimitereponse:future, nature:'APPEL_OFFRE', ...overrides};
}
const page = (results, total_count = results.length) => Response.json({results,total_count});

test('exclude expired or ambiguous notices, keep latest rectification and prioritize execution area', async () => {
  const rows = [notice('26-1'), notice('26-2'), notice('26-3'), notice('26-4',{datelimitereponse:expired}),
    notice('26-5',{code_departement:['54','57']}), notice('26-6',{code_departement:['54'],code_departement_prestation:['57']}),
    notice('26-7',{objet:'Fourniture de mobilier'}), notice('26-8',{nature:'ATTRIBUTION'}), notice('26-9',{datelimitereponse:null}),
    notice('26-10',{code_departement_prestation:['75']}), notice('26-11',{etat:'RECTIFICATIF',dateparution:'2026-01-02'})];
  const changes = [{idweb:'26-12',nature:'ANNULATION',dateparution:'2026-02-01',annonce_lie:['26-1']},
    {idweb:'26-11',nature:'APPEL_OFFRE',etat:'RECTIFICATIF',dateparution:'2026-01-02',annonce_lie:['26-2']}];
  const actual = await getOffers(async url => url.searchParams.get('where').includes('annonce_lie IN') ? page(changes) : page(rows));
  assert.deepEqual(actual.map(row=>row.idweb).sort(),['26-11','26-3','26-6']);
});

test('fetch following pages and refresh when the official dataset changes', async () => {
  let id='26-91';
  const offsets = [];
  const fetcher = async url => {
    if (url.searchParams.get('where').includes('annonce_lie IN')) return page([]);
    const offset = Number(url.searchParams.get('offset')); offsets.push(offset);
    return offset === 0 ? page(Array.from({length:100},()=>notice('26-1',{objet:'Mobilier'})),101) : page([notice(id)],101);
  };
  assert.equal((await getOffers(fetcher))[0].idweb,id);
  id='26-92';
  assert.equal((await getOffers(fetcher))[0].idweb,id);
  assert.deepEqual(offsets,[0,100,0,100]);
});

test('unavailable or incomplete data raises an error, an empty official feed returns no offers', async () => {
  assert.deepEqual(await getOffers(async()=>page([])),[]);
  await assert.rejects(getOffers(async()=>new Response('',{status:503})),/HTTP 503/);
  await assert.rejects(getOffers(async()=>page([],50)),/incomplète/);
  await assert.rejects(getOffers(async()=>Response.json({})),/inattendue/);
});
