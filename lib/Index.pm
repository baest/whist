package Index;
use 5.014;
use Text::MicroTemplate qw(:all);

my $data;
my $template;

sub default {
	unless ($data) {
		$data = render_mt($template, {
		})->as_string;
	}

	return [ 200, [ 'Content-Type' => 'text/html', 'charset' => 'utf-8' ], [ $data ] ];
}

$template = <<'EOT';
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title id='title'>Whist</title>

		<!-- ** CSS ** -->
		<!-- base library -->
		<link rel="stylesheet" type="text/css" href="/static/extjs/resources/css/ext-all.css" />
		<link rel="stylesheet" type="text/css" href="/static/style/app.css" />

		<script type="text/javascript" src="/static/extjs/bootstrap.js"></script>
		<script type="text/javascript" src="/static/extjs/locale/ext-lang-da.js"></script>
		<script type="text/javascript" src="/static/script/app.js"></script>

		<!-- overrides to base library -->
	</head>
	<body>
		<div id="header" class="x-panel-header x-hide-display">
			Whist
		</div>
		<div id="editor-grid"></div>
	</body>
</html>
EOT

1;
