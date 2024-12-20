'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryClient, QueryClientProvider, useMutation, useQueries } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ky from 'ky';
import { Search } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type Language = {
    name: string;
    url: string;
};

interface Translation {
    language: Language;
    name: string;
}

interface Genus {
    genus: string;
    language: Language;
}

interface FlavorTextEntries {
    flavor_text: string;
    language: Language;
    version: {
        name: string;
        url: string;
    };
}

interface Sprites {
    back_default: string;
    front_default: string;
    other: {
        showdown: { front_default: string };
        'official-artwork': { front_default: string };
    };
}

interface MovesData {
    move: {
        name: string;
        url: string;
    };
}

interface MovesDetail {
    names: Translation[];
    name: string;
}

interface BasePokemonData {
    name: string;
    id: string;
    genera: string;
    sprites: Sprites;
    pokeFlavorText: FlavorTextEntries[];
}

type PokemonData = BasePokemonData & {
    moves: MovesData[];
};

// 將 fetchPokemonMove 函數移到頂層，便於 Content 組件使用
const fetchPokemonMove = async (url: string) => {
    try {
        const pokemonMove = await ky.get(url).json();
        return pokemonMove;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const SearchArea = () => {
    const [inputValue, setInputValue] = useState('');
    const [submitValue, setSubmitValue] = useState('');

    const fetchPokemonContent = async (id: string) => {
        try {
            const json = await ky.get(`https://pokeapi.co/api/v2/pokemon/${id}`).json();
            return json as PokemonData;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    };

    const fetchPokemonName = async (id: string) => {
        try {
            const pokemonName = await ky.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`).json();
            return pokemonName;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    };

    const fetchPokemon = async (id: string) => {
        const json = await fetchPokemonContent(id);
        const pokemonName = await fetchPokemonName(id);
        const { names, genera, flavor_text_entries } = pokemonName as {
            names: Translation[];
            genera: Genus[];
            flavor_text_entries: FlavorTextEntries[];
        };

        const pokeNameZh = names.filter((name) => name.language.name === 'zh-Hant' || name.language.name === 'ja');
        const pokeGeneraZh = genera.filter((genus) => genus.language.name === 'zh-Hant');
        const pokeFlavorText = flavor_text_entries.filter((flavor) => flavor.language.name === 'zh-Hant');
        const nameCombine = `${pokeNameZh[0]?.name ?? 'Unknown'} ${pokeNameZh[1]?.name ?? ''}`;
        const genusData = pokeGeneraZh[0]?.genus ?? 'Unknown';
        const pokeData = {
            ...json,
            name: nameCombine,
            genera: genusData,
            pokeFlavorText,
        };
        return pokeData;
    };

    const mutation = useMutation({
        mutationFn: async (id: string) => {
            const json = await fetchPokemon(id);
            return json;
        },
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSearch = async (e: React.MouseEvent<HTMLButtonElement>) => {
        setSubmitValue(inputValue);
        mutation.mutate(inputValue);
    };

    return (
        <>
            <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                    type='search'
                    placeholder='Search Pokémon...'
                    className='pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]'
                    value={inputValue}
                    onChange={handleChange}
                />
                <Button onClick={handleSearch}>Search</Button>
            </div>
            {mutation.isPending && (
                <div className='flex justify-center items-center h-screen'>
                    <div className='animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500' />
                </div>
            )}
            {mutation.isError && (
                <div className='flex flex-col items-center justify-center min-h-screen bg-yellow-100'>
                    <div className='bg-white p-8 rounded-lg shadow-lg text-center'>
                        <img
                            src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
                            alt='Pikachu'
                            className='w-24 h-24 mx-auto mb-4'
                        />
                        <h1 className='text-3xl font-bold text-yellow-600 mb-4'>Oops! 發生了一點小錯誤</h1>
                        <p className='text-gray-700 text-lg'>
                            像是皮卡丘在玩耍的時候不小心撞到了一些線路，導致我們暫時無法找到您要的資訊。
                        </p>
                    </div>
                </div>
            )}
            {mutation.isSuccess && <Content apiData={mutation.data} />}
        </>
    );
};

const Content = ({ apiData }: { apiData: PokemonData }) => {
    const {
        name,
        id,
        genera,
        sprites: {
            back_default,
            front_default,
            other: {
                showdown: { front_default: gifFront },
                'official-artwork': { front_default: officialFront },
            },
        },
        pokeFlavorText,
        moves,
    } = apiData;

    // 提取所有移動的 URL
    const moveUrls = moves.map((move) => move.move.url);

    // 使用 useQueries 並行抓取所有移動資料
    const moveQueries = useQueries({
        queries: moveUrls.map((url) => ({
            queryKey: ['move', url],
            queryFn: () => fetchPokemonMove(url),
        })),
    });

    // 檢查是否有任何一個移動正在加載
    const isMovesLoading = moveQueries.some((query) => query.isLoading);
    // 檢查是否有任何一個移動發生錯誤
    const isMovesError = moveQueries.some((query) => query.isError);
    // 獲取所有成功的移動資料
    const movesData = moveQueries.map((query) => query.data).filter(Boolean);

    if (isMovesLoading) {
        return (
            <div className='flex justify-center items-center h-screen'>
                <div className='animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500' />
            </div>
        );
    }

    if (isMovesError) {
        return (
            <div className='flex flex-col items-center justify-center min-h-screen bg-yellow-100'>
                <div className='bg-white p-8 rounded-lg shadow-lg text-center'>
                    <img
                        src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
                        alt='Pikachu'
                        className='w-24 h-24 mx-auto mb-4'
                    />
                    <h1 className='text-3xl font-bold text-yellow-600 mb-4'>Oops! 發生了一點小錯誤</h1>
                    <p className='text-gray-700 text-lg'>
                        像是皮卡丘在玩耍的時候不小心撞到了一些線路，導致我們暫時無法找到您要的資訊。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg bg-white p-6 m-4'>
            <div className='text-center text-2xl font-bold mb-2 flex items-center justify-center'>
                <span className='text-gray-500 mr-2'>ID: {id}</span>
                <span>{name}</span>
            </div>
            <div className='text-center text-blue-600 text-sm font-semibold mb-4'>{`種類: ${genera}`}</div>
            <div className='space-y-4'>
                {pokeFlavorText.map((flavor) => {
                    const {
                        flavor_text,
                        version: { name },
                    } = flavor;
                    return (
                        <div key={`flavor_${name}`} className='grid grid-cols-12 gap-4 items-center mb-2'>
                            <div className='col-span-3 bg-gray-100 text-black px-3 py-1 rounded-full shadow text-center'>
                                {name}
                            </div>
                            <div className='col-span-9 text-gray-700'>{flavor_text}</div>
                        </div>
                    );
                })}
            </div>
            <div className='flex justify-center items-center space-x-4 mt-4'>
                <img className='w-20 h-20' src={officialFront} alt={`${name} front`} />
                <img className='w-20 h-20' src={back_default} alt={`${name} back`} />
                <img className='w-20 h-20' src={front_default} alt={`${name} front`} />
                <img className='w-20 h-20' src={gifFront} alt={`${name} gif`} />
            </div>
            <div className='flex flex-wrap justify-start items-center space-x-2 mb-4'>
                {movesData.map((move, index) => {
                    const { names, name } = move as MovesDetail;
                    const zhName = names.find((name) => name.language.name === 'zh-Hant')?.name || 'Unknown';
                    return (
                        <div
                            key={`moves_${id}_${name}`}
                            className='bg-gray-100 text-black px-3 py-1 rounded-full shadow mb-2'
                        >
                            {zhName}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SearchContainer = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false, // 默認為 true，可以根據需求調整
            },
        },
    });
    return (
        <QueryClientProvider client={queryClient}>
            <SearchArea />
            <ReactQueryDevtools />
        </QueryClientProvider>
    );
};

export default SearchContainer;
