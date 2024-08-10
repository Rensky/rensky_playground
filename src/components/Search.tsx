'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ky from 'ky';
import { Search } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type PokemonData = {
    name: string;
    id: string;
    sprites: {
        back_default: string;
        front_default: string;
        other: {
            showdown: { front_default: string };
            'official-artwork': { front_default: string };
        };
    };
};

interface Language {
    name: string;
    url: string;
}

interface Translation {
    language: Language;
    name: string;
}

const SearchArea = () => {
    const fetchPokemon = async (id: string) => {
        const json = (await ky.get(`https://pokeapi.co/api/v2/pokemon/${id}`).json()) as PokemonData;
        const pokemonName = await ky.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`).json();
        const { names } = pokemonName as { names: Translation[] };
        const pokeNameZh = names.filter((name) => name.language.name === 'zh-Hant' || name.language.name === 'ja');
        const nameCombine = `${pokeNameZh[0].name} ${pokeNameZh[1].name}`;
        const pokeData = {
            ...json,
            name: nameCombine,
        };
        return pokeData;
    };

    const [inputValue, setInputValue] = useState('');
    const [pokemonData, setPokemonData] = useState<PokemonData>({
        name: '',
        id: '',
        sprites: {
            back_default: '',
            front_default: '',
            other: {
                showdown: { front_default: '' },
                'official-artwork': { front_default: '' },
            },
        },
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSearch = async () => {
        const fetchPokemonData = (await fetchPokemon(inputValue)) as PokemonData;
        setPokemonData(fetchPokemonData);
    };
    const {
        name,
        id,
        sprites: {
            back_default,
            front_default,
            other: {
                showdown: { front_default: gifFront },
                'official-artwork': { front_default: officialFront },
            },
        },
    } = pokemonData;
    return (
        <>
            <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                    type='search'
                    placeholder='Search products...'
                    className='pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]'
                    value={inputValue}
                    onChange={handleChange}
                />
                <Button onClick={handleSearch}>Search</Button>
            </div>
            <div className='max-w-sm rounded overflow-hidden shadow-lg bg-white p-4 m-4'>
                <div className='text-center text-2xl font-bold mb-2'>{name}</div>
                <div className='text-center text-gray-700 text-base mb-4'>ID: {id}</div>
                <div className='flex justify-center items-center space-x-4'>
                    <img className='w-24 h-24' src={officialFront} alt={`${name} front`} />
                    <img className='w-24 h-24' src={back_default} alt={`${name} back`} />
                    <img className='w-24 h-24' src={front_default} alt={`${name} front`} />
                    <img className='w-8 h-8' src={gifFront} alt={`${name} gif`} />
                </div>
            </div>
        </>
    );
};

export default SearchArea;
