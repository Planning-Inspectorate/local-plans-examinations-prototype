const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const express = require('express');

const filename = path.resolve(__dirname, '../app/views/projects/back-office/manage/examination/v6/_plan-pause.js');
const localRequire = createRequire(filename);
const routeModule = { exports: {} };
vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
	require(name) {
		return name === 'govuk-prototype-kit'
			? { requests: { setupRouter: () => express.Router() } }
			: localRequire(name);
	},
	module: routeModule
}, { filename });

function submit(date, context, url = '/plan-pause') {
	const input = url.startsWith('/plan-pause-actual-end') ? 'plan-pause-actual-end-date' : 'plan-pause-date';
	const session = {
		currentCaseRef: 'PLAN/000001',
		data: {},
		planPauseDate: '1/10/2026',
		planPauseEndDate: '2/10/2026',
		examinationV6PauseDraft: { date: '3/10/2026' },
		examinationV6PauseHistory: [{ date: '4/10/2026', reason: 'Earlier pause' }]
	};
	const before = structuredClone(session);
	session.save = callback => callback();
	const result = {
		locals: {},
		statusCode: 200,
		status(code) { this.statusCode = code; return this; },
		render(template, data) { this.template = template; this.data = data; },
		redirect(destination) { this.destination = destination; }
	};
	routeModule.exports.handle({
		method: 'POST',
		url,
		baseUrl: '/projects/back-office/manage/examination/v6',
		body: {
			[`${input}-day`]: date[0],
			[`${input}-month`]: date[1],
			[`${input}-year`]: date[2],
			returnUrl: '/return-to-plan',
			...context
		},
		session
	}, result, error => {
		if (error) throw error;
		assert.fail('Expected pause date route to handle request');
	});
	return { session, before, result };
}

for (const [mode, context] of [['current', {}], ['historical', { pauseIndex: '0' }]]) {
	for (const [label, date, message] of [
		['empty', ['', '', ''], 'Enter the examination restart date'],
		['incomplete', ['1', '', '2026'], 'Enter a complete examination restart date'],
		['impossible', ['31', '2', '2026'], 'Enter a valid examination restart date'],
		['non-numeric', ['1abc', '10', '2026'], 'Enter a valid examination restart date'],
		['short year', ['1', '10', '26'], 'Enter a valid examination restart date'],
		['non-leap year', ['29', '2', '2026'], 'Enter a valid examination restart date']
	]) {
		for (const url of ['/plan-pause-actual-end', '/plan-pause-actual-end.html']) {
			test(`${mode} restart rejects ${label} date on ${url} without changing stored data`, () => {
				const { session, before, result } = submit(date, context, url);
				assert.equal(result.statusCode, 400);
				assert.equal(result.data.error, message);
				assert.equal(result.data.planPauseActualEndDate, date.join('/'));
				assert.equal(result.data.returnUrl, '/return-to-plan');
				assert.equal(result.data.pauseIndex, context.pauseIndex);
				assert.equal(result.data.caseRef, 'PLAN/000001');
				const { save, ...stored } = session;
				assert.deepEqual(stored, before);
				assert.equal(result.destination, undefined);
			});
		}
	}
	for (const url of ['/plan-pause-actual-end', '/plan-pause-actual-end.html']) {
		test(`${mode} restart accepts a valid leap day on ${url}`, () => {
			const { session, result } = submit([' 29 ', ' 02 ', ' 2028 '], context, url);
			assert.equal(result.statusCode, 200);
			if (mode === 'historical') {
				assert.equal(session.examinationV6PauseHistory[0].actualEndDate, '29/2/2028');
				assert.equal(result.destination, '/return-to-plan');
			} else {
				assert.equal(session.planPauseActualEndDate, '29/2/2028');
				assert.equal(session.planPauseDecision, 'Resolved');
				assert.ok(result.destination.includes('/plan-pause-decision-reason?'));
			}
		});
	}
}

for (const [mode, context] of [
	['current', {}],
	['new', { newPause: 'true' }],
	['historical', { pauseIndex: '0' }]
]) {
	for (const [label, date, message] of [
		['empty', ['', '', ''], 'Enter the examination pause start date'],
		['incomplete', ['1', '', '2026'], 'Enter a complete examination pause start date'],
		['impossible', ['31', '2', '2026'], 'Enter a valid examination pause start date'],
		['non-numeric', ['1abc', '10', '2026'], 'Enter a valid examination pause start date'],
		['short year', ['1', '10', '26'], 'Enter a valid examination pause start date'],
		['non-leap year', ['29', '2', '2026'], 'Enter a valid examination pause start date']
	]) {
		test(`${mode} pause rejects ${label} date without changing stored data`, () => {
			const { session, before, result } = submit(date, context);
			assert.equal(result.statusCode, 400);
			assert.equal(result.data.error, message);
			assert.equal(result.data.planPauseDate, date.join('/'));
			assert.equal(result.data.returnUrl, '/return-to-plan');
			assert.equal(result.data.pauseIndex, context.pauseIndex);
			assert.equal(result.data.newPause, context.newPause === 'true');
			assert.equal(result.data.caseRef, 'PLAN/000001');
			const { save, ...stored } = session;
			assert.deepEqual(stored, before);
			assert.equal(result.destination, undefined);
		});
	}

	for (const url of ['/plan-pause', '/plan-pause.html']) {
		test(`${mode} pause accepts a valid leap day on ${url}`, () => {
			const { session, result } = submit([' 29 ', ' 02 ', ' 2028 '], context, url);
			assert.equal(result.statusCode, 200);
			assert.ok(result.destination);
			if (mode === 'historical') {
				assert.equal(session.examinationV6PauseHistory[0].date, '29/2/2028');
				assert.equal(result.destination, '/return-to-plan');
			} else if (mode === 'new') {
				assert.equal(session.examinationV6PauseDraft.date, '29/2/2028');
				assert.equal(session.planPauseDate, '1/10/2026');
				assert.ok(result.destination.endsWith('&newPause=true'));
			} else {
				assert.equal(session.planPauseDate, '29/2/2028');
				assert.equal(session.planPauseEndDate, undefined);
			}
		});
	}
}
