package Round;
use 5.014;
use JSON;
use Regexp::Common qw/number/;
use List::MoreUtils 'each_array';
use DDP;

sub delete {
	my ($self, $args) = @_;

	my $data = decode_json($args->{req}->content); 
	$data = [ $data ] if ref $data eq 'HASH';

	p $data;

	foreach (@$data) {
		$args->{db}->do('DELETE FROM round WHERE game_id = ? AND id = ?', {}, $_->{game_id}, $_->{id});
	}

	return return_json([]);
}

sub insert {
	my ($self, $args) = @_;

	my $data = decode_json($args->{req}->content); 
	$data = [ $data ] if ref $data eq 'HASH';

	my @fields = qw/sara jacob martin dorte/;

	my $db = $args->{db};

	foreach my $row (@$data) {
		my $err = { id => $row->{id}, sara => 0, jacob => 0, dorte => 0, martin => 0, game_id => $row->{game_id} };
		my @ins = ('game_id');
		my @values = ($args->{session}->get('game'));
		my $sum = 0;
		foreach(@fields) {
			return r401() unless exists $row->{$_} && $row->{$_} =~ /^$RE{num}{int}$/;

			push @ins, $_;
			push @values, $row->{$_};

			$sum += $row->{$_};
		}

		return r401() unless $sum == 0;

		my $exists;
		($exists) = $db->selectrow_array('SELECT 1 FROM round WHERE id = ?', {}, $row->{id}) if $row->{id};

		my $sql;
		if ($exists) {
			$sql = 'UPDATE round SET ';
			$sql .= join(', ', map { "$_ = ?" } @ins);
			$sql .= ' WHERE id = ? RETURNING id';
			push @values, $row->{id};
		}
		else {
			if ($row->{id}) {
				push @ins, 'id';
				push @values, $row->{id};
			}
			$sql = 'INSERT INTO round (' . join(', ', @ins) . ') VALUES(';
			$sql .= join(', ', map { '?' } @values) . ') RETURNING id';
		}

#		warn $sql;

		$row->{id} = $db->selectrow_array($sql, {}, @values);
	}

	return return_json($data);

	#return $self->get($args);
}

sub get {
	my ($self, $args) = @_;

	my $db = $args->{db};

	my $result = $db->selectall_arrayref('SELECT * FROM round WHERE game_id = ?', {Slice => {}}, $args->{session}->get('game'));

	return return_json({ rounds => $result, total => scalar @$result});
}

sub return_json {
	my ($data) = @_;
	return [ 200, [ 'Content-Type' => 'application/json', 'charset' => 'utf-8' ], [ encode_json($data) ] ];
}

sub r401 {
	return [ 401, [ 'Content-Type' => 'text/plain' ], ['Forbidden'] ];
}

1;
