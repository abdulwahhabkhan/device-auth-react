<?php

declare(strict_types=1);

namespace AbdulWahhabKhan\DeviceAuth\React\Console;

use Illuminate\Console\Command;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'device-auth:react-install')]
final class InstallCommand extends Command
{
    protected $signature = 'device-auth:react-install {--force : Overwrite files that were already published}';

    protected $description = 'Publish the device-auth React pages and their config';

    public function handle(): int
    {
        foreach (['device-auth-react-config', 'device-auth-react'] as $tag) {
            $this->callSilently('vendor:publish', ['--tag' => $tag, '--force' => (bool) $this->option('force')]);
        }

        $this->components->info('Device auth React pages published to resources/js/pages/device-auth.');
        $this->components->bulletList([
            'Run <comment>php artisan device-auth:install</comment> if you haven\'t (config, migrations, actions)',
            'The verify and confirm pages draw their own layout. Exclude them from your default layout in <comment>createInertiaApp</comment>:',
        ]);

        $this->line(<<<'TSX'
                layout: (name) => {
                    if (name === 'device-auth/verify' || name === 'device-auth/confirm') return null;
                    // ...your existing rules
                },
            TSX);

        $this->newLine();
        $this->components->info('Rebuild assets: npm run build');

        return self::SUCCESS;
    }
}
