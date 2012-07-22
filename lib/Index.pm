package Index;
use 5.014;
use Text::MicroTemplate qw(:all);

my $data;
my $template;
use JSON;

sub default {
	my ($self, $args) = @_;

	unless ($data) {
		$data = render_mt($template, {
				js_conf => encoded_string(encode_json({ game_id => $args->{session}->get('game') })),
		})->as_string;
	}

	warn encode_json({ game_id => $args->{session}->get('game') });

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

		<script type="text/javascript"> var whist_conf = <?= $_[0]->{js_conf} ?></script>

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
