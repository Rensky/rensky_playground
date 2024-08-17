'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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

const initialData: PokemonData = {
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
};

type Language = {
    name: string;
    url: string;
};

interface Translation {
    language: Language;
    name: string;
}

const SearchArea = () => {
    const [inputValue, setInputValue] = useState('');
    const [submitValue, setSubmitValue] = useState('');

    const fetchPokemonContent = async (id: string) => {
        const json = (await ky.get(`https://pokeapi.co/api/v2/pokemon/${id}`).json()) as PokemonData;
        return json;
    };

    const fetchPokemonName = async (id: string) => {
        const pokemonName = await ky.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`).json();
        return pokemonName;
    };

    const fetchPokemon = async (id: string) => {
        const json = await fetchPokemonContent(id);
        const pokemonName = await fetchPokemonName(id);
        const { names } = pokemonName as { names: Translation[] };
        const pokeNameZh = names.filter((name) => name.language.name === 'zh-Hant' || name.language.name === 'ja');
        const nameCombine = `${pokeNameZh[0].name} ${pokeNameZh[1].name}`;
        const pokeData = {
            ...json,
            name: nameCombine,
        };
        return pokeData;
    };

    const { data } = useQuery({
        queryKey: ['pokemon', submitValue],
        queryFn: () => fetchPokemon(submitValue),
        initialData: initialData,
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSearch = async (e: React.MouseEvent<HTMLButtonElement>) => {
        setSubmitValue(inputValue);
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
    } = data as PokemonData;

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

const SearchContainer = () => {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <SearchArea />
            <ReactQueryDevtools />
        </QueryClientProvider>
    );
};

export default SearchContainer;
