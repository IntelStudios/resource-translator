#!/usr/bin/env python3
"""
Copies captializations status of first character of .resx files
Usage: python match-translation-uppercase.py root.resx
- will copy the status to root.cz.resx, root.es.resx, ...
"""

import re
import unicodedata

from sys import argv
from pathlib import Path
from typing import Set, Tuple, Iterator, Any, Iterable, Match
import xml.etree.ElementTree as ElementTree

ONLY_CAPITALIZE = True  # set to false to allow also converting for lowercase (beware German language)

ANYTHING = r"(?:.|\n)*?"
WHITESPACE = r"(?:\s|\n)*?"


def strip_accents(s: str) -> str:
    """
    Removes diacritics from string and converts to ascii
    :param s: string in unicode
    :return: string in ascii
    """
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')


def get_capitalized_data_names(file: Path) -> Tuple[Set[str], Set[str]]:
    """
    Finds all capitalized and lowercased data names in file
    :param file: RESX file to look into
    :return: set of capitalized and set of lowercased data names
    """
    with file.open() as f:
        content = f.read()
    capitalized_data_names: Set[str] = set()
    lowercased_data_names: Set[str] = set()
    for x in re.finditer(fr'<data\s+name="({ANYTHING})"{ANYTHING}>{WHITESPACE}'
                         fr'<value>¿?({ANYTHING})</value>{WHITESPACE}</data>',
                         content, re.I | re.M):
        name, value = x.group(1), x.group(2)
        first_char = strip_accents(value[0]) if value else None
        if first_char and first_char.isalpha():
            if first_char.isupper():
                capitalized_data_names.add(name)
            else:
                lowercased_data_names.add(name)

    assert capitalized_data_names or lowercased_data_names, f"no keys found inside {file.absolute()}"
    return capitalized_data_names, lowercased_data_names


def merge(a: Iterable[Any], b: Iterable[Any]) -> Iterator[Any]:
    """
    Mergers two iterators into one by yielding a and then b
    :param a: first iterator
    :param b: second iterator
    :return: a and then b
    """
    for x in a:
        yield x
    for x in b:
        yield x


def test_correctness(file_template: Path, file_derived: Path) -> bool:
    """
    Tests that nothing was broken during changes and everything was formatted correctly
    :param file_template: original file
    :param file_derived: modified file
    :return: True if everything was changed correctly and nothing was broken
    """
    root_template = ElementTree.parse(f"{file_template.absolute()}")
    root_derived = ElementTree.parse(f"{file_derived.absolute()}")

    for el_data in root_template.findall(".//value/..[@name]"):
        data_name = el_data.get('name')
        val_template = el_data.find('value').text
        ch_template = strip_accents(val_template) if val_template else None

        val_derived = root_derived.find(f'.//value/..[@name="{data_name}"]/value').text
        ch_derived = strip_accents(val_derived) if val_derived else None

        val_template_uppercased = False
        if ch_template and ch_template.isalpha():
            val_template_uppercased = ch_template.isupper()

        val_derived_uppercased = False
        if ch_derived and ch_derived.isalpha():
            val_derived_uppercased = ch_derived.isupper()

        case_matches = val_template_uppercased == val_derived_uppercased
        if not case_matches and ONLY_CAPITALIZE and val_derived_uppercased:
            case_matches = True

        if not case_matches:
            print('ERR:', data_name, '-', val_template, 'vs', val_derived, ';',
                  val_template_uppercased, 'vs', val_derived_uppercased)
            return False

    return True


def main() -> None:
    file_template = Path(argv[1])
    assert file_template.exists()

    file_template_name = re.escape(file_template.name[::-1].split('.', 1)[1][::-1])
    file_template_extension = re.escape(file_template.name.split('.')[-1])

    capitalized_data_names, lowercased_data_names = get_capitalized_data_names(file_template)
    assert not (capitalized_data_names.intersection(lowercased_data_names)), \
        "captialized and lowercased must be disjunctive"

    for file_derived in file_template.parent.iterdir():
        if not re.match(fr"{file_template_name}\.[a-zA-Z0-9]+\.{file_template_extension}", file_derived.name):
            continue

        print(file_template.name, '->', file_derived.name)

        with file_derived.open() as f:
            content = f.read()

        for data_name in merge(capitalized_data_names, lowercased_data_names):
            to_upper = data_name in capitalized_data_names
            to_lower = not ONLY_CAPITALIZE and data_name in lowercased_data_names
            data_name = re.escape(data_name)
            value_pre = fr'<data\s+name="{data_name}"{ANYTHING}>{WHITESPACE}<value>¿?'

            def transform(x: Match) -> str:
                prefix: str = x.group(1)
                first_char: str = x.group(2)

                if to_upper:
                    first_char = first_char.upper()
                elif to_lower:
                    first_char = first_char.lower()
                return prefix + first_char

            content = re.sub(fr'({value_pre})(.)', transform, content, 1, re.I)

        with file_derived.open('w') as f:
            f.write(content)

        assert test_correctness(file_template, file_derived)


if __name__ == '__main__':
    main()
