Ext.Loader.setConfig({
    enabled: true
});

function render_number (value) {
	var cls = (value >= 0) ? 'positive' : 'negative';
	return '<span class="' + cls + '">' + Ext.util.Format.number(value, '0,000') + '</span>';
}

Ext.define('Ext.grid.column.score', {
	extend: 'Ext.grid.column.Number'
,	alias: 'widget.score'
,	editor: {
		// defaults to textfield if no xtype is supplied
		allowBlank: false
	}
,	defaultRenderer: render_number
,	summaryType: 'sum'
, summaryRenderer: render_number
});

Ext.application({
	name: 'whist'
,	requires: [
			'Ext.grid.*',
			'Ext.data.*',
			'Ext.util.*',
			'Ext.state.*',
			'Ext.form.*',
	]
,	stores: [ 'round', 'melding', 'melding_type', 'players' ]
, models: [ 'whist.model.round' ]

,	launch: function() {
    // Define our data model
    // create the Data Store

    var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
        clicksToMoveEditor: 1,
        autoCancel: false
    });

    // create the grid and specify what field you want
    // to use for the editor at each column.
		var grid = Ext.create('Ext.grid.Panel', {
			store: 'round'
		, features: [{
				id: 'group'
			,	ftype: 'groupingsummary'
			,	groupHeaderTpl: '{name}'
			,	hideGroupedHeader: true
			,	enableGroupingMenu: false
			}]
		,	columns: [
					{
							header: 'Sara'
						,	dataIndex: 'sara'
						,	xtype: 'score'
					}
				,	{
							header: 'Jacob'
						,	dataIndex: 'jacob'
						,	xtype: 'score'
					}
				,	{
							header: 'Dorte'
						,	dataIndex: 'dorte'
						,	xtype: 'score'
					}
				,	{
							header: 'Martin'
						,	dataIndex: 'martin'
						,	xtype: 'score'
					}
				]
			,	renderTo: 'editor-grid'
//			,	width: 600
//			,	height: 400
			,	title: 'Whist'
			,	frame: true
			,	tbar: [
					{
						text: 'Tilføj resultat'
					,	handler : function() {
							var store = Ext.getStore('round');
							store.suspendAutoSync( );
							rowEditing.cancelEdit();

							// Create a model instance
							var r = Ext.create('whist.model.round', {
								sara: 0 
							,	jacob: 0 
							,	dorte: 0 
							,	martin: 0 
							,	game_id: 1 // value is just some value, game_id will be set by backend
							});

							var num = store.getCount();
							store.insert(num, r);
							rowEditing.startEdit(num, 0);
							store.resumeAutoSync( );
						}
					}
				,	{
						text: 'Beregn score'
					,	handler : function() {
							var mywin = Ext.create('Ext.window.Window', {
								title: 'Beregning'
							,	bodyPadding: 5
							,	height: 200
							,	width: 400
							,	layout: 'fit'
							,	items: {
									xtype: 'form'
								,	border: false
								,	layout: 'anchor'
								,	defaultType: 'textfield'
//								,	width: 390
//								,	height: 190
								,	defaults: {
										anchor: '100%'
								  }
								,	items: [
										{
											fieldLabel: 'Melding'
										,	name: 'melding_name'
										,	xtype: 'combobox'
										,	allowBlank: false
										,	queryMode: 'local'
										,	valueField: 'name'
										,	displayField: 'name'
										,	store: 'melding'
										}
									,	{
											fieldLabel: 'Melding type'
										,	name: 'melding_type'
										,	xtype: 'combobox'
										,	allowBlank: true
										,	queryMode: 'local'
										,	valueField: 'name'
										,	displayField: 'name'
										,	store: 'melding_type'
										}
									,	{
											fieldLabel: 'Meldere'
										,	name: 'betters'
										,	xtype: 'combobox'
										,	allowBlank: false
										,	queryMode: 'local'
										,	valueField: 'name'
										,	displayField: 'name'
										,	store: 'players'
										,	multiSelect: true
										}
									,	{
											fieldLabel: 'Overstik'
										,	name: 'overstik'
										, value: 0
										,	allowBlank: false
										}
									]
									, buttons: [{
											text: 'Gem'
										,	handler: function () {
												this.up('form').submit();
											}
									}]
								, submit: function () {
										var form = this.getForm()
											, round_store = Ext.getStore('round')
											,	values =  form.getValues()
											,	melding_store = Ext.getStore('melding')
											, melding = melding_store.findRecord('name', values.melding_name)
											,	melding_cost = melding.get('cost')
											,	betters = values.betters
											, num_betters = betters.length
											, players_store = Ext.getStore('players')
											, num_players = players_store.getCount()
											,	overstik = parseInt(values.overstik)
											, multiplier = 1
											, final_multiplier = 1
										;

										if (!form.isValid())
											return;


										if ("melding_type" in values) {
											var store = Ext.getStore('melding_type');
											multiplier = store.findRecord('name', values.melding_type).get('multiplier');
										}

										var overstik_price = melding_cost * .5;
										var full_house = (13 == (parseInt(melding.get('name')) + overstik));
										//console.debug((parseInt(melding.get('name')) + overstik));
										//console.debug(full_house);

										if (full_house) {
											overstik--; // last one only multiplies
											final_multiplier *= 2;
										}

										if (overstik < 0) {
											overstik++; // last one only multiplies
											final_multiplier *= -2;
										}

										var cost = final_multiplier * ((melding_cost * multiplier) + (overstik_price * Math.abs(overstik)));

										var rec = {
											game_id: 1 // value is just some value, game_id will be set by backend
										};

										players_store.each(function(r) {
											var name = r.get('name')
												, short_name = Ext.util.Format.lowercase(name);

											if (Ext.Array.contains(betters, name)) {
												var better_cost = cost;

												if (num_betters * 2 != num_players)
													better_cost *= 3;

												rec[short_name] = better_cost;
											}
											else {
												rec[short_name] = -1 * cost;
											}
										});

										var r = Ext.create('whist.model.round', rec);
										//console.debug(r);
										var num = round_store.getCount();
										round_store.insert(num, r);

										//console.debug(cost);
										//console.debug(rec);

										mywin.hide();
										return false;
									}
								}
							});
							mywin.show();
						}
					}
				,	{
						itemId: 'remove'
					,	text: 'Slet'
					,	handler: function() {
							var sm = grid.getSelectionModel();
							rowEditing.cancelEdit();
							var store = Ext.getStore('round');
							store.remove(sm.getSelection());
							if (store.getCount() > 0) {
								sm.select(0);
							}
						}
					,	disabled: true
        }
				]
			,	plugins: [rowEditing]
			,	listeners: {
					'selectionchange': function(view, records) {
						grid.down('#remove').setDisabled(!records.length);
					}
				}
    });
	}
});

Ext.define('whist.model.round', {
	extend: 'Ext.data.Model',
	fields: [
		{ name: 'game_id', type: 'int' }
	,	{ name: 'sara', type: 'int' }
	,	{ name: 'dorte', type: 'int' }
	,	{ name: 'jacob', type: 'int' }
	,	{ name: 'martin', type: 'int' }
	]
});

Ext.define('whist.store.round', {
	model: 'whist.model.round' 
, extend: 'Ext.data.Store'
,	autoLoad: true
,	autoSync: true
,	groupField: 'game_id'
,	proxy: {
		type: 'ajax'
	,	url: '/service/round'
	, api: {
			read: '/service/round'
		,	create: '/service/round'
		,	update: '/service/round'
		,	destroy: '/service/del_round'
		}
	,	reader: {
			type: 'json'
		,	root: 'rounds'
		}
	,	writer: {
			type: 'json'
		, allowSingle: false
		}
	}
});

Ext.define('whist.store.melding', {
		extend: 'Ext.data.Store'
	,	fields: ['name', 'cost']
	,	data: [
			{ name: '8', cost: 10 }
		,	{ name: '9', cost: 30 }
		,	{ name: 'Sol', cost: 50 }
		,	{ name: '10', cost: 90 }
		,	{ name: 'Ren sol', cost: 100 }
		,	{ name: '11', cost: 250 }
		,	{ name: 'På bord', cost: 300 }
		,	{ name: '12', cost: 600 }
		,	{ name: 'Ren bord', cost: 700 }
		,	{ name: '13', cost: 1300 }
		]
});

Ext.define('whist.store.melding_type', {
		extend: 'Ext.data.Store'
	,	fields: ['name', 'multiplier']
	,	data: [
			{ name: 'Gode', multiplier: 1.5 }
		,	{ name: 'Halve', multiplier: 1.5 }
		,	{ name: 'Grand', multiplier: 1.5 }
		,	{ name: '2 VIP', multiplier: 2 }
		,	{ name: '4 VIP', multiplier: 4 }
		,	{ name: '8 VIP', multiplier: 8 }
		]
});

Ext.define('whist.store.players', {
		extend: 'Ext.data.Store'
	,	fields: ['name']
	,	data: [
			{ name: 'Sara' }
		,	{ name: 'Jacob' }
		,	{ name: 'Dorte' }
		,	{ name: 'Martin' }
		]
});
