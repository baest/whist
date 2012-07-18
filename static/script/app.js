Ext.Loader.setConfig({
    enabled: true
});

Ext.require([
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.state.*',
    'Ext.form.*',
]);

function render_number (value) {
	var cls = (value >= 0) ? 'positive' : 'negative';
	return '<span class="' + cls + '">' + Ext.util.Format.number(value, '0,000') + '</span>';
}


Ext.onReady(function(){
    // Define our data model
    Ext.define('round', {
        extend: 'Ext.data.Model',
        fields: [
        	{ name: 'game_id', type: 'int' }
				,	{ name: 'sara', type: 'int' }
        ,	{ name: 'dorte', type: 'int' }
        ,	{ name: 'jacob', type: 'int' }
        ,	{ name: 'martin', type: 'int' }
        ]
    });

    // create the Data Store
    var store = Ext.create('Ext.data.Store', {
				model: 'round' 
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

    var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
        clicksToMoveEditor: 1,
        autoCancel: false
    });

    // create the grid and specify what field you want
    // to use for the editor at each column.
		var grid = Ext.create('Ext.grid.Panel', {
			store: store
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
							store.suspendAutoSync( );
							rowEditing.cancelEdit();

							// Create a model instance
							var r = Ext.create('round', {
								sara: 0 
							,	jacob: 0 
							,	dorte: 0 
							,	martin: 0 
							,	game_id: 0
							});

							var num = store.getCount();
							store.insert(num, r);
							rowEditing.startEdit(num, 0);
							store.resumeAutoSync( );
						}
					}
				,	{
						itemId: 'remove'
					,	text: 'Slet'
					,	handler: function() {
							var sm = grid.getSelectionModel();
							rowEditing.cancelEdit();
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
});
