# -*- coding: utf-8 -*-
#
# Copyright (C) Pootle contributors.
# Copyright (C) Zing contributors.
#
# This file is a part of the Zing project. It is distributed under the GPL3
# or later license. See the LICENSE file for a copy of the license and the
# AUTHORS file for copyright and authorship information.

import logging
import os

os.environ["DJANGO_SETTINGS_MODULE"] = "pootle.settings"

from pootle_app.management.commands import PootleCommand
from pootle_language.models import clear_language_list_cache
from pootle_translationproject.models import scan_translation_projects


class Command(PootleCommand):
    help = "Update database stores from files."
    process_disabled_projects = True

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--overwrite",
            action="store_true",
            dest="overwrite",
            default=False,
            help="Don't just update untranslated units "
            "and add new units, but overwrite database "
            "translations to reflect state in files.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            dest="force",
            default=False,
            help="Unconditionally process all files (even if they "
            "appear unchanged).",
        )

    def handle_translation_project(self, translation_project, **options):
        """
        :return: flag if child stores should be updated
        """
        if translation_project.directory_exists_on_disk():
            translation_project.update_from_disk(
                force=options["force"], overwrite=options["overwrite"]
            )
            return False

        if translation_project.project.directory_exists_on_disk():
            translation_project.directory.makeobsolete()
        else:
            # Skip if project directory ceased to exist on disk.
            logging.warning(
                u"Missing project directory for %s. Skipping %s.",
                translation_project.project,
                translation_project,
            )

        return False

    def handle_all(self, **options):
        scan_translation_projects(languages=self.languages, projects=self.projects)

        super().handle_all(**options)

        clear_language_list_cache()
